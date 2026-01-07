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
    
    if not capable_user_ids:
        print("No capable users found via Ontology.")
        return []
        
    print(f"Found {len(capable_user_ids)} capable candidates: {capable_user_ids}")

    # 3. Compute Semantic Scores for Candidates
    semantic_scores = {}
    for uid in capable_user_ids:
        user_data = user_db.get(uid)
        if user_data:
            # Construct user context from bio + projects
            user_text = user_data.bio + " " + " ".join([p.get('description', '') for p in user_data.projects])
            user_vec = nlp_engine.embed(user_text)
            sim_score = nlp_engine.compute_similarity(problem_vec, user_vec)
            semantic_scores[uid] = sim_score
    
    # 4. Hybrid Ranking
    ranked_experts = ranker.rank(
        candidates=capable_user_ids,
        problem_data=problem,
        user_db=user_db,
        semantic_score_map=semantic_scores
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
