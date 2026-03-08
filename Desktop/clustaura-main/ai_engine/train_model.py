import os
import json
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
from nlp_engine import NLPEngine

def train_intent_model():
    print("Starting Intent Model Training...")
    
    # 1. Initialize NLP Engine for embeddings
    nlp = NLPEngine()
    
    # 2. Define Training Data (Synthetic but targeted)
    # This expands on the previous intent list with more variety
    training_data = {
        "onboarding": [
            "What can I do here?", "How does this platform work?", "Getting started guide", 
            "New user help", "Show me around", "What is ClustAura?", "platform overview",
            "how to use this", "introduction to the app", "onboarding process"
        ],
        "post_problem": [
            "How do I post a problem?", "Create a new problem", "I have an issue to solve", 
            "Post standard problem", "submission guide", "where to post issues",
            "asking for help with a problem", "post a technical challenge", "new challenge creation"
        ],
        "find_experts": [
            "How to find experts?", "Find someone to solve my issue", "Search for collaborators", 
            "I need help with my project", "matching with experts", "how does expert matching work",
            "finding developers", "search for skills", "recommend experts for me"
        ],
        "profile_help": [
            "How to improve my profile?", "Edit skills", "Update experience", "Profile settings",
            "add new skills", "change my bio", "profile picture", "experience update",
            "making my profile better", "account profile help"
        ],
        "manage_posts": [
            "Where are my posts?", "View my problems", "Manage submissions", "Delete a post",
            "edit my challenge", "check status of my post", "my active problems",
            "history of my submissions", "closing a problem"
        ],
        "collaboration": [
            "Project workspace", "How to collaborate?", "Team work tools", "Shared projects",
            "open workplace", "how to start a team", "collaboration features",
            "working together on an issue", "project management tools"
        ],
        "ai_explanation": [
            "How does the AI work?", "Explain AI matching", "Is this using AI?", 
            "How do you find experts?", "AI logic", "matching algorithm",
            "is it artificial intelligence?", "benefit of AI here", "how smart is the bot"
        ],
        "account_setup": [
            "Account settings", "Change password", "Login issues", "Signup help",
            "security settings", "deleting account", "notification preferences",
            "email verification", "forgot password"
        ],
        "community_browse": [
            "Go to community", "What's new in community?", "Browse challenges", "See posts",
            "community feed", "explore community", "check out recent solutions",
            "what are people talking about?", "community module", "latest challenges"
        ],
        "community_filter": [
            "Filter by profession", "Show me developers", "Engineering posts",
            "how to use filters?", "category filtering", "search by role",
            "filter community feed", "find engineering challenges", "marketing posts",
            "profession based filtering", "narrow down the feed"
        ],
        "community_interact": [
            "How to vote?", "Upvote a post", "Leave a comment", "Reply to someone",
            "commenting on a challenge", "voting mechanism", "downvote meaning",
            "social features in community", "interacting with posts", "post reactions"
        ],
        "community_manage": [
            "How to edit my post?", "Delete my submission", "Manage community posts",
            "change my challenge title", "remove my post", "edit content of my post",
            "can I delete a comment?", "updating my community posts", "post authorship"
        ],
        "navigation_home": [
            "Back to dashboard", "Return home", "Home button", "Leave community",
            "dashboard link", "exit community", "how to get back to main page",
            "go to dashboard", "main menu", "home navigation"
        ]
    }

    X_text = []
    y_labels = []

    for intent, queries in training_data.items():
        for query in queries:
            X_text.append(query)
            y_labels.append(intent)

    print(f"Generating embeddings for {len(X_text)} samples...")
    # Convert text to embeddings
    X_embeddings = np.array([nlp.embed(text).cpu().detach().numpy() if hasattr(nlp.embed(text), 'cpu') else nlp.embed(text) for text in X_text])
    
    # 3. Encode Labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y_labels)
    
    # 4. Train Classifier (MLP for a balance of power and speed)
    print("Training MLP Classifier...")
    clf = MLPClassifier(
        hidden_layer_sizes=(64, 32), 
        max_iter=500, 
        activation='relu', 
        solver='adam', 
        random_state=42
    )
    clf.fit(X_embeddings, y_encoded)
    
    # 5. Save Model and Label Encoder
    model_dir = "models"
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        
    joblib.dump(clf, os.path.join(model_dir, "intent_model.joblib"))
    joblib.dump(le, os.path.join(model_dir, "label_encoder.joblib"))
    
    print(f"Training Complete! Model saved in {model_dir}/")
    print(f"Trained on {len(X_text)} samples across {len(le.classes_)} intents.")

if __name__ == "__main__":
    train_intent_model()
