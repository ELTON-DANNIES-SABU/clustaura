from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os

from ontology import OntologyManager
from nlp_engine import NLPEngine
from ranker import HybridRanker
from intent_classifier import IntentClassifier
from guide_logic import GuideLogic

app = FastAPI(title="ClustAura AI Engine", version="1.0.0")

# --- Data Models ---

class Skill(BaseModel):
    name: str
    category: Optional[str] = None

class UserProfile(BaseModel):
    user_id: str
    bio: str
    skills: List[str]
    projects: List[Dict[str, Any]] = []
    posts: List[Dict[str, Any]] = []

class ProblemStatement(BaseModel):
    problem_id: str
    title: str
    description: str
    required_skills: List[str]
    candidate_ids: Optional[List[str]] = None
    domain: Optional[str] = None

class ExpertRecommendation(BaseModel):
    user_id: str
    rank: int
    match_score: float
    explanation: str
    key_skills: List[str]

# --- Global Instances ---
ontology_manager = None
nlp_engine = None
ranker = None
intent_classifier = None
guide_logic = None
user_db = {} # In-memory cache for demo performance

@app.on_event("startup")
async def startup_event():
    global ontology_manager, nlp_engine, ranker, intent_classifier, guide_logic
    print("Initializing ClustAura AI Engine...")
    
    ontology_manager = OntologyManager()
    nlp_engine = NLPEngine()
    ranker = HybridRanker()
    
    # Initialize Guide Components
    intent_classifier = IntentClassifier(nlp_engine)
    guide_logic = GuideLogic()
    
    print("AI Engine Ready.")

@app.get("/")
def read_root():
    return {"status": "online", "service": "ClustAura AI Engine"}

@app.post("/recommend", response_model=List[ExpertRecommendation])
async def recommend_experts(problem: ProblemStatement):
    """
    Main endpoint to get expert recommendations for a given problem.
    """
    print(f"Received recommendation request for problem: {problem.title}")
    
    # 1. Generate Problem Embedding
    problem_text = f"{problem.title} {problem.description}"
    problem_vec = nlp_engine.embed(problem_text)
    
    # 2. Ontology Filtering (The Gatekeeper)
    # Find all users capable of solving this problem
    capable_user_ids = ontology_manager.find_capable_users(problem.required_skills)
    
    
    # 2.5 Filter by Candidate IDs (if provided)
    if problem.candidate_ids is not None:
        # If specific candidates are requested (e.g., commenters), filter the pool
        # We intersection with capable_user_ids to ensure they still have *some* relevance (optional)
        # OR we just use the candidate_ids provided, depending on desired strictness.
        
        # Strategy: Use provided candidates, but still apply ontology capability check?
        # User asked to "check only the profiles of commenters".
        # If we respect ontology Strictness, we intersect. 
        # If we just want to rank the commenters regardless of skill match, we use problem.candidate_ids.
        # Given previous "No capable users" issue, let's include them but score them low if they don't match.
        
        # However, ranker needs them to be in user_db
        valid_candidates = [uid for uid in problem.candidate_ids if uid in user_db]
        
        if not valid_candidates:
             print("No valid candidates found in provided candidate_ids (not in user_db).")
             return []
             
        # We override capable_user_ids with the provided list (filtered by valid users)
        # We allow them even if ontology says "False" because we want to rank THIS group.
        capable_user_ids = valid_candidates
        print(f"Filtered to {len(capable_user_ids)} specific candidates.")

    elif not capable_user_ids:
        print("No capable users found via Ontology.")
        return []
        
    print(f"Found {len(capable_user_ids)} capable candidates: {capable_user_ids}")

    # 3. Compute Scores for Candidates
    semantic_scores = {}
    ontology_scores = {}
    
    for uid in capable_user_ids:
        user_data = user_db.get(uid)
        if user_data:
            # A. Semantic Score (Bio + Projects + Posts)
            # Combine all textual evidence of expertise
            project_text = " ".join([p.get('description', '') for p in user_data.projects])
            
            # [NEW] Include Post content
            post_text = " ".join([f"{p.get('title', '')} {p.get('content', '')}" for p in user_data.posts])
            
            user_text = f"{user_data.bio} {project_text} {post_text}"
            
            user_vec = nlp_engine.embed(user_text)
            sim_score = nlp_engine.compute_similarity(problem_vec, user_vec)
            semantic_scores[uid] = sim_score
            
            # B. Ontology Score (Tree Distance)
            onto_score = ontology_manager.calculate_user_similarity(user_data.skills, problem.required_skills)
            ontology_scores[uid] = onto_score
    
    # 4. Hybrid Ranking
    ranked_experts = ranker.rank(
        candidates=capable_user_ids,
        problem_data=problem,
        user_db=user_db,
        semantic_score_map=semantic_scores,
        ontology_score_map=ontology_scores
    )
    
    return ranked_experts

@app.post("/ingest/user")
async def ingest_user(user: UserProfile):
    """
    Endpoint to add/update a user in the ontology and semantic index.
    """
    try:
        # Update In-Memory DB
        user_db[user.user_id] = user
        
        # Update Ontology
        # Convert Pydantic model to dict for manager
        ontology_manager.add_user(user.dict())
        
        print(f"User {user.user_id} ingested successfully.")
        return {"status": "success", "user_id": user.user_id}
    except Exception as e:
        print(f"Error ingesting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class GuideQuery(BaseModel):
    query: str
    current_page: Optional[str] = None

@app.post("/guide/query")
async def query_guide(request: GuideQuery):
    """
    Endpoint for the AI Guide chatbot.
    """
    global intent_classifier, guide_logic
    
    if not intent_classifier or not guide_logic:
        raise HTTPException(status_code=503, detail="AI Guide services not initialized")

    print(f"DEBUG: Guide Query Received: {request.query} on page {request.current_page}")
    
    # 1. Classify Intent
    intent, score = intent_classifier.classify(request.query)
    print(f"DEBUG: Classified Intent: {intent} with score {score:.4f}")
    
    # 2. Generate Response
    response = guide_logic.get_response(intent, score, request.current_page)
    print(f"DEBUG: Generated Response: {response['text'][:50]}...")
    
    return response

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
