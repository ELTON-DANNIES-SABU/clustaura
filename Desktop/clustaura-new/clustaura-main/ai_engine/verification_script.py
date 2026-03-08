import requests
import json

BASE_URL = "http://localhost:8000"

def test_system():
    # 1. Ingest Users
    users = [
        {
            "user_id": "alice_ml",
            "bio": "I am a Senior Data Scientist specializing in time-series analysis and anomaly detection using Python.",
            "skills": ["Anomaly Detection", "Python", "Pandas"],
            "projects": [
                {"title": "Log Anomaly Finder", "description": "Built a system to detect anomalies in server logs.", "skills_demonstrated": ["Anomaly Detection"]}
            ]
        },
        {
            "user_id": "bob_web",
            "bio": "Full stack developer loving React and Node.js.",
            "skills": ["React", "Node.js", "Web Development"],
            "projects": []
        },
        {
            "user_id": "charlie_novice",
            "bio": "Just started learning Python.",
            "skills": ["Python"],
            "projects": []
        }
    ]
    
    print("--- Ingesting Users ---")
    for u in users:
        try:
            # We need to simulate the API call, but since we can't easily run the server 
            # and the script in parallel in this environment without blocking,
            # this script assumes the server is running.
            # However, for this artifacts purpose, I'll print what SHOULD happen
            # or use the internal classes if I can import them (but they are in server.py context).
            
            # Ideally, we'd use 'requests.post' if server was up.
            pass
        except Exception as e:
            print(f"Failed to ingest {u['user_id']}: {e}")

    # Since I cannot easily start the server and keep it running while running this script
    # in the current tool environment (background processes are tricky to check output for),
    # I will create a direct integration test using the modules directly.
    
    print("Switching to direct module test...")
    from ontology import OntologyManager
    from nlp_engine import NLPEngine
    from ranker import HybridRanker
    
    # Initialize
    onto = OntologyManager()
    nlp = NLPEngine()
    ranker = HybridRanker()
    user_db = {}
    
    # Ingest
    for u in users:
        onto.add_user(u)
        user_db[u['user_id']] = u
        print(f"Ingested {u['user_id']}")
        
    # Define Problem
    problem = {
        "problem_id": "p1",
        "title": "Need help detecting anomalies in financial transaction logs",
        "description": "I have thousands of logs and need to find outliers using unsupervised learning.",
        "required_skills": ["Machine Learning"], 
        # Note: 'Anomaly Detection' is a subskill of 'Machine Learning' in our ontology? 
        # Wait, if problem requires 'Machine Learning', user with 'Anomaly Detection' 
        # should qualify IF 'Anomaly Detection' IS A 'Machine Learning'.
        # Let's check ontology.py: AnomalyDetection -> DeepLearning -> MachineLearning.
        # So YES, AnomalyDetection implies MachineLearning? 
        # NO. Subskill implies Parent skill?
        # If I know 'Anomaly Detection', do I know 'Machine Learning'? Yes.
        # If Problem requires 'Machine Learning', do I qualify? Yes.
        # But `_user_has_skill` logic:
        # User has S_owned. Check if S_owned implies S_required.
        # implementation says: owned_skill isSubSkillOf* req_skill.
        # AnomalyDetection -> DeepLearning -> MachineLearning.
        # So AnomalyDetection isSubSkillOf MachineLearning.
        # If User has AnomalyDetection, and Problem requires MachineLearning.
        # isSubSkillOf(AnomalyDetection, MachineLearning) IS TRUE.
        # So Alice should match.
    }
    
    print("\n--- Processing Problem ---")
    print(f"Problem: {problem['title']}")
    print(f"Requires: {problem['required_skills']}")
    
    # 1. Embedding
    prob_text = problem['title'] + " " + problem['description']
    prob_vec = nlp.embed(prob_text)
    
    # 2. Ontology Filter
    # alice_ml has "Anomaly Detection" which is subskill of "Machine Learning"?
    # Let's verify taxonomy in ontology.py
    # "Anomaly Detection": ["Deep Learning", "Machine Learning"] -> It is child of ML.
    # Alice has Anomaly Detection. 
    candidates = onto.find_capable_users(problem['required_skills'])
    print(f"\nCandidates found via Ontology: {candidates}")
    
    # 3. Rank
    semantic_scores = {}
    for uid in candidates:
        u = user_db[uid]
        u_text = u['bio']
        u_vec = nlp.embed(u_text)
        score = nlp.compute_similarity(prob_vec, u_vec)
        semantic_scores[uid] = score
        
    class MockProblem(object):
        pass
    p_obj = MockProblem()
    p_obj.required_skills = problem['required_skills']
    
    results = ranker.rank(candidates, p_obj, user_db, semantic_scores)
    
    print("\n--- Ranked Results ---")
    for r in results:
        print(f"Rank {r['rank']}: {r['user_id']} (Score: {r['match_score']})")
        print(f"Explanation: {r['explanation']}")

if __name__ == "__main__":
    test_system()
