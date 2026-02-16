import requests
import json

def test_guide_query():
    url = "http://127.0.0.1:8000/guide/query"
    payload = {
        "query": "hello",
        "current_page": "/"
    }
    
    print(f"Testing {url} with payload {payload}")
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_guide_query()
