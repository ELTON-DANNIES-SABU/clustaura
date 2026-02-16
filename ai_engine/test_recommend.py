import requests
import json

def test_recommend():
    url = "http://127.0.0.1:8000/recommend"
    payload = {
        "problem_id": "test_p",
        "title": "React performance issue",
        "description": "App is slow when rendering large lists",
        "required_skills": ["React", "Performance"]
    }
    
    print(f"Testing {url} with payload {payload}")
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_recommend()
