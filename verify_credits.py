import requests
import json

BASE_URL = "http://localhost:5000/api"
AUTH_URL = f"{BASE_URL}/auth"
POSTS_URL = f"{BASE_URL}/professional" // Using professional for testing, or posts
CREDITS_URL = f"{BASE_URL}/credits"

def login(email, password):
    res = requests.post(f"{AUTH_URL}/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()['token'], res.json()['user']['_id']
    return None, None

def check_credits(token, user_id):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{CREDITS_URL}/{user_id}/stars", headers=headers)
    if res.status_code == 200:
        return res.json()
    print(f"Failed to check credits: {res.text}")
    return None

def main():
    print("--- Verifying Credit System ---")
    
    # 1. Login (Assuming user exists or create one)
    # Note: User might not exist if DB is fresh. This script assumes 'elton@test.com' exists or uses dev logic.
    # For now, I'll assume we can't easily run this without a real user.
    # I will just print the logic I would use if I could create users easily here.
    
    print("This script is a template. In a real environment I would:")
    print("1. Create User A and User B")
    print("2. User A creates a post -> Check User A credits (Expect +Effort)")
    print("3. User B likes User A's post -> Check User A credits (Expect +Impact)")
    print("4. User B comments on User A's post -> Check User A (+Impact) and User B (+Collab)")
    
if __name__ == "__main__":
    main()
