from typing import Dict, Optional, Any

class GuideLogic:
    def __init__(self):
        # Map intents to base responses and actions
        self.intent_map = {
            "onboarding": {
                "text": "ClustAura helps you post professional problems and connect with people who can solve them. Would you like to explore existing challenges or post your own?",
                "action": {"label": "Explore Challenges", "link": "/challenges"} 
            },
            "post_problem": {
                "text": "You can post your problem in the Challenges section using the composer. Our AI will then match you with experts! Want to go there now?",
                "action": {"label": "Go to Challenges", "link": "/challenges"} 
            },
            "find_experts": {
                "text": "Our AI looks at your problem and finds people whose past work and skills best match it. You can see this in action on the Challenges page.",
                "action": {"label": "Find Experts", "link": "/challenges"}
            },
            "profile_help": {
                "text": "Keeping your profile updated helps us match you with the right opportunities. You can edit your skills and experience in your Profile.",
                "action": {"label": "Go to Profile", "link": "/profile"}
            },
            "manage_posts": {
                "text": "You can view and manage all your posted problems and their status in your Dashboard.",
                "action": {"label": "Go to Dashboard", "link": "/dashboard"}
            },
            "collaboration": {
                "text": "Once you match with an expert, you can collaborate in the Project Workspace. Do you want to see your active projects?",
                "action": {"label": "Open Workspace", "link": "/workplace"}
            },
            "ai_explanation": {
                "text": "Our AI acts as a smart matchmaker. It analyzes problem descriptions and user profiles to connect the right people. It's designed to save you time finding experts.",
                "action": {"label": "Learn More", "link": "/how-it-works"} # Placeholder if no specific page
            },
            "account_setup": {
                "text": "You can manage your account settings, password, and preferences from your Profile page.",
                "action": {"label": "Account Settings", "link": "/profile"}
            },
            "general_help": { # Fallback for low confidence but not zero
                 "text": "I can help you navigate ClustAura, post problems, or find experts. What would you like to do?",
                 "action": None
            },
            "community_browse": {
                "text": "The Community section is where the magic happens! Browse challenges, find solutions, and connect with peers.",
                "action": {"label": "Browse Community", "link": "/community"}
            },
            "community_filter": {
                "text": "You can use the Left Sidebar to filter posts by profession. It helps you find relevant challenges in your field instantly.",
                "action": {"label": "Go To Community", "link": "/community"}
            },
            "community_interact": {
                "text": "In ClustAura Community, you can upvote posts you like and leave comments to share your knowledge or ask questions.",
                "action": {"label": "Explore Posts", "link": "/community"}
            },
            "community_manage": {
                "text": "Manage your posts with ease. As an author, you can edit your content or delete a post if needed using the icons on your post card.",
                "action": {"label": "My Posts", "link": "/community"}
            },
            "navigation_home": {
                "text": "Need to get back? Click the Home icon or use this link to return to your main Dashboard.",
                "action": {"label": "Go to Dashboard", "link": "/dashboard"}
            }
        }

    def get_response(self, intent: str, score: float, current_page: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a context-aware response based on intent and current page.
        """
        response_data = self.intent_map.get(intent)
        
        if not response_data:
            return {
                "text": "I'm not sure I understood that. I can help you with posting problems, finding experts, or navigating the platform.",
                "action": None,
                "intent": intent
            }

        text = response_data["text"]
        action = response_data["action"]

        # Context-aware adjustments
        if intent == "post_problem" and current_page == "/create-challenge":
             text = "You're already on the right page! Fill out the details above to post your problem. Need help with the description?"
             action = None # No need to navigate
        
        elif intent == "profile_help" and current_page == "/profile":
             text = "You are on your profile. You can click the 'Edit' button to update your skills and bio."
             action = None

        return {
            "text": text,
            "action": action,
            "intent": intent,
            "confidence": score
        }
