from sentence_transformers import SentenceTransformer, util
import numpy as np

class NLPEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        print(f"Loading NLP Model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print("NLP Model Loaded.")

    def embed(self, text: str):
        """
        Generate a dense vector embedding for the given text.
        """
        if not text:
            return np.zeros(384) # Default dimension for MiniLM
        return self.model.encode(text, convert_to_tensor=True)

    def compute_similarity(self, vec1, vec2) -> float:
        """
        Compute cosine similarity between two vectors.
        Returns a float between 0.0 and 1.0
        """
        # util.cos_sim returns a tensor, we assume 1D vectors here usually
        # but encode returns tensor by default given my flag above.
        score = util.cos_sim(vec1, vec2)
        return float(score[0][0])
