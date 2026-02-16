from typing import List, Dict, Any
from pydantic import BaseModel

class HybridRanker:
    def __init__(self):
        # Weights
        self.w_ontology = 0.4
        self.w_semantic = 0.3
        self.w_experience = 0.2
        self.w_activity = 0.1

    def rank(self, candidates: List[str], problem_data: Any, user_db: Dict[str, Any], semantic_score_map: Dict[str, float], ontology_score_map: Dict[str, float]) -> List[Dict]:
        """
        Rank a list of candidate user IDs based on the hybrid formula.
        
        candidates: List of User IDs who passed the ontology filter.
        problem_data: ProblemStatement object (or dict).
        user_db: internal dictionary mapping user_id -> UserProfile object/dict.
        semantic_score_map: Pre-computed semantic similarity for these users.
        ontology_score_map: Pre-computed ontology similarity (SF scores).
        """
        ranked_results = []
        
        for uid in candidates:
            user = user_db.get(uid)
            if not user:
                continue
                
            # 1. Ontology Score (SF Match)
            score_onto = ontology_score_map.get(uid, 0.0)
            
            # 2. Semantic Score
            score_sem = semantic_score_map.get(uid, 0.0)
            
            # 3. Experience Score
            # Formula: min(1.0, count(projects + posts) / 10)
            
            # Helper to safely get field from dict or object
            def get_field(obj, field, default):
                if isinstance(obj, dict):
                    return obj.get(field, default)
                return getattr(obj, field, default)

            proj_count = len(get_field(user, 'projects', []))
            post_count = len(get_field(user, 'posts', []))
            raw_exp = proj_count + post_count
            score_exp = min(1.0, raw_exp / 10.0)
            
            # 4. Activity Score
            score_act = 1.0 if raw_exp > 0 else 0.5
            
            # Final Score Calculation
            final_score = (
                (self.w_ontology * score_onto) +
                (self.w_semantic * score_sem) +
                (self.w_experience * score_exp) +
                (self.w_activity * score_act)
            )
            
            # Generate Explanation
            explanation = self._generate_explanation(user, score_onto, score_sem, score_exp)
            
            # Key matched skills (simple intersection for display)
            req_skills = set(p.lower() for p in problem_data.required_skills)
            user_skills = set(p.lower() for p in get_field(user, 'skills', []))
            matched = list(req_skills.intersection(user_skills))
            
            ranked_results.append({
                "user_id": uid,
                "rank": 0, # to be assigned after sort
                "match_score": round(final_score * 100, 2),
                "ontology_score": round(score_onto, 4),
                "explanation": explanation,
                "key_skills": matched
            })
            
        # Sort by score descending
        ranked_results.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Assign ranks
        for i, res in enumerate(ranked_results):
            res['rank'] = i + 1
            
        return ranked_results

    def _generate_explanation(self, user, onto_score, sem_score, exp_score):
        reasons = []
        if onto_score > 0.8:
            reasons.append("Strong skill alignment via ontology matching.")
        elif onto_score > 0.5:
            reasons.append("Relevant expertise in related skill domains.")

        if sem_score > 0.7:
            reasons.append("High semantic relevance to the problem context.")
        if exp_score > 0.5:
            reasons.append("Significant track record in this domain.")
            
        return "Recommended because: " + " ".join(reasons)
