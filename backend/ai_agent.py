import os
import json
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

class AIAgent:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.api_url = GEMINI_API_URL

    def generate_game_config(self, child_profile: Dict[str, Any], previous_sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate personalized game configuration using Gemini API."""
        if not self.api_key:
            logger.error("Gemini API key not set.")
            return self._fallback_config()

        prompt = self._build_prompt(child_profile, previous_sessions)
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
        data = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }
        try:
            response = requests.post(self.api_url, headers=headers, json=data, timeout=20)
            response.raise_for_status()
            result = response.json()
            
            # Log the raw response for debugging
            logger.info(f"Gemini API response: {result}")
            
            # Gemini returns a list of candidates, each with content.parts[0].text
            if "candidates" in result and len(result["candidates"]) > 0:
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                logger.info(f"Gemini generated text: {text}")
                
                # Expecting JSON in the response (might be wrapped in markdown)
                try:
                    # Clean the text - remove markdown code blocks if present
                    cleaned_text = text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]  # Remove ```json
                    if cleaned_text.startswith("```"):
                        cleaned_text = cleaned_text[3:]   # Remove ```
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]  # Remove ```
                    cleaned_text = cleaned_text.strip()
                    
                    config = json.loads(cleaned_text)
                    logger.info(f"Successfully parsed Gemini config: {config}")
                    return config
                except Exception as e:
                    logger.error(f"Gemini response not valid JSON: {e}")
                    logger.error(f"Raw text from Gemini: {text}")
                    logger.error(f"Cleaned text: {cleaned_text}")
                    return self._fallback_config()
            else:
                logger.error(f"Gemini response has no candidates: {result}")
                return self._fallback_config()
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._fallback_config()

    def _build_prompt(self, child_profile, previous_sessions):
        return f"""You are an expert in adaptive game design for autism assessment. Generate a personalized game configuration in JSON format.

Child Profile: {json.dumps(child_profile)}
Previous Sessions: {json.dumps(previous_sessions)}

Generate a JSON configuration with this exact structure:
{{
  "level_config": {{
    "difficulty": 2,
    "shapes": ["circle", "square", "triangle"],
    "colors": ["red", "blue", "green"],
    "sounds": true,
    "animation_speed": 1.0,
    "surprise_elements": ["color_change", "size_change"]
  }},
  "assessment_focus": ["attention", "motor_skills", "pattern_recognition"],
  "session_duration": 10,
  "break_intervals": 3,
  "motivation_elements": ["celebration_sounds", "progress_indicators"]
}}

Adapt the configuration based on the child's age, special interests, and previous session performance. Return ONLY the JSON, no other text."""

    def _fallback_config(self):
        return {
            "level_config": {
                "difficulty": 2,
                "shapes": ["circle", "square", "triangle"],
                "colors": ["red", "blue", "green"],
                "sounds": True,
                "animation_speed": 1.0,
                "surprise_elements": ["color_change", "size_change"]
            },
            "assessment_focus": ["attention", "motor_skills", "pattern_recognition"],
            "session_duration": 10,
            "break_intervals": 3,
            "motivation_elements": ["celebration_sounds", "progress_indicators"]
        }

def generate_game_config(child_profile: Dict[str, Any], previous_sessions: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    if previous_sessions is None:
        previous_sessions = []
    agent = AIAgent()
    return agent.generate_game_config(child_profile, previous_sessions)