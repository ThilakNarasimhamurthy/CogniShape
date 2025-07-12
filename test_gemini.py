#!/usr/bin/env python3
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def test_gemini_api():
    """Test the Gemini API directly."""
    
    # Get API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        return False
    
    print(f"🔑 API Key found: {api_key[:10]}...")
    
    # Test URL
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    # Simple test prompt
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Generate a simple JSON object with a 'test' field set to 'success'. Return only the JSON, no other text."
                    }
                ]
            }
        ]
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": api_key
    }
    
    try:
        print("🚀 Making API request...")
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            if "candidates" in result and len(result["candidates"]) > 0:
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                print(f"📝 Generated text: {text}")
                
                # Clean the text - remove markdown code blocks if present
                cleaned_text = text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]  # Remove ```json
                if cleaned_text.startswith("```"):
                    cleaned_text = cleaned_text[3:]   # Remove ```
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]  # Remove ```
                cleaned_text = cleaned_text.strip()
                
                print(f"🧹 Cleaned text: {cleaned_text}")
                
                try:
                    parsed = json.loads(cleaned_text)
                    print(f"✅ Successfully parsed JSON: {parsed}")
                    return True
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse JSON: {e}")
                    return False
            else:
                print(f"❌ No candidates in response: {result}")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"📄 Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Gemini API...")
    success = test_gemini_api()
    if success:
        print("✅ Gemini API test successful!")
    else:
        print("❌ Gemini API test failed!") 