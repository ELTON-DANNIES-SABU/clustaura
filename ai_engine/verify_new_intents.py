import requests
import json

def test_new_intents():
    url = "http://127.0.0.1:8000/guide/query"
    queries = [
        "How do I filter posts in the community?",
        "Can I edit my own post?",
        "How to go back home?",
        "I want to see the community feed",
        "How do I vote on a post?"
    ]
    
    for query in queries:
        print(f"\nTesting Query: '{query}'")
        payload = {"query": query, "current_page": "/community"}
        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"Intent: {data.get('intent')}")
                print(f"Confidence: {data.get('confidence'):.2f}")
                print(f"Response: {data.get('text')}")
                print(f"Action: {data.get('action')}")
            else:
                print(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error connecting to AI engine: {e}")

if __name__ == "__main__":
    test_new_intents()
