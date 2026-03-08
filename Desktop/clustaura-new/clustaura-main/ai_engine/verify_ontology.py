import sys
import os

# Add current directory to path so we can import ontology
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ontology import OntologyManager

def test_ontology():
    print("Testing Ontology Logic...")
    manager = OntologyManager()
    
    # 1. Test Seeded Taxonomy
    print("\nTaxonomy Levels:")
    for skill, level in manager.levels.items():
        print(f"  {skill.split('_')[-1]}: Level {level}")

    # 2. Test Similarity (SF)
    # Python (Level 1) -> Programming (Level 0)
    # Machine Learning (Level 2) -> Python (Level 1)
    
    sim_aa = manager.skill_similarity("Python", "Python")
    sim_ab = manager.skill_similarity("Python", "Programming")
    sim_ac = manager.skill_similarity("Machine Learning", "Programming")
    sim_ad = manager.skill_similarity("React", "Programming")
    sim_ae = manager.skill_similarity("React", "Python") # Unrelated?
    
    print("\nSimilarity Scores (SF):")
    print(f"  Python <-> Python: {sim_aa:.4f} (Expected: 1.0)")
    print(f"  Python <-> Programming: {sim_ab:.4f}")
    print(f"  Machine Learning <-> Programming: {sim_ac:.4f}")
    print(f"  React <-> Programming: {sim_ad:.4f}")
    print(f"  React <-> Python: {sim_ae:.4f} (Expected: Low or Penalty)")

    # 3. Test User Similarity (MSSP-style)
    user_skills = ["Python", "Machine Learning"]
    problem_skills = ["Programming", "Deep Learning"]
    
    user_sim = manager.calculate_user_similarity(user_skills, problem_skills)
    print(f"\nUser Recommendation Score:")
    print(f"  User Skills: {user_skills}")
    print(f"  Problem Skills: {problem_skills}")
    print(f"  Final Score: {user_sim:.4f}")

    # 4. Capability Filtering
    capable = manager.find_capable_users(problem_skills)
    print(f"\nCapability Check (Problem: {problem_skills}): {capable}")

if __name__ == "__main__":
    test_ontology()
