import os
import numpy as np
import joblib
from typing import Tuple, Dict, List
from nlp_engine import NLPEngine

class IntentClassifier:
    def __init__(self, nlp_engine: NLPEngine):
        self.nlp_engine = nlp_engine
        self.model_path = "models/intent_model.joblib"
        self.le_path = "models/label_encoder.joblib"
        self.model = None
        self.label_encoder = None
        
        self.load_model()
        
        # Fallback intents (from training data structure) for cases where model is missing
        self.intents: Dict[str, List[str]] = {
            "onboarding": ["What can I do here?", "How does this platform work?", "Getting started guide"],
            "post_problem": ["How do I post a problem?", "Create a new problem"],
            "find_experts": ["How to find experts?", "Find someone to solve my issue"],
            "profile_help": ["How to improve my profile?", "Edit skills"],
            "manage_posts": ["Where are my posts?", "View my problems"],
            "collaboration": ["Project workspace", "How to collaborate?"],
            "ai_explanation": ["How does the AI work?", "Explain AI matching"],
            "account_setup": ["Account settings", "Change password"]
        }

    def load_model(self):
        """Loads the trained classifier and label encoder."""
        if os.path.exists(self.model_path) and os.path.exists(self.le_path):
            try:
                self.model = joblib.load(self.model_path)
                self.label_encoder = joblib.load(self.le_path)
                print("Trained Intent Model Loaded Successfully.")
            except Exception as e:
                print(f"Error loading trained model: {e}")
        else:
            print("No trained model found. Falling back to semantic similarity.")

    def classify(self, text: str, threshold: float = 0.4) -> Tuple[str, float]:
        """
        Returns (intent, confidence_score)
        Uses trained model if available, otherwise falls back to similarity.
        """
        if not text:
            return "unknown", 0.0

        # Generate embedding for the input text
        text_vec = self.nlp_engine.embed(text)
        
        # Convert tensor to numpy for scikit-learn
        if hasattr(text_vec, 'cpu'):
            text_vec_np = text_vec.cpu().detach().numpy().reshape(1, -1)
        else:
            text_vec_np = text_vec.reshape(1, -1)

        # 1. Use Trained Model if available
        if self.model and self.label_encoder:
            try:
                probs = self.model.predict_proba(text_vec_np)[0]
                best_idx = np.argmax(probs)
                score = float(probs[best_idx])
                intent = self.label_encoder.inverse_transform([best_idx])[0]
                
                if score >= threshold:
                    return intent, score
            except Exception as e:
                print(f"Prediction error: {e}")

        # 2. Fallback to Semantic Similarity (Best for zero-shot or when model is low confidence)
        best_intent = "general_help"
        best_score = -1.0

        for intent, queries in self.intents.items():
            for query in queries:
                stored_vec = self.nlp_engine.embed(query)
                score = self.nlp_engine.compute_similarity(text_vec, stored_vec)
                if score > best_score:
                    best_score = score
                    best_intent = intent
        
        if best_score < 0.3: # Hard floor for fallback
            return "general_help", best_score
            
        return best_intent, best_score
