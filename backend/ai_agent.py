import openai
import json
import os
import redis
import hashlib
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import asyncio
import logging

load_dotenv()

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Configure Redis for caching (optional)
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        decode_responses=True
    )
    CACHE_ENABLED = True
except:
    CACHE_ENABLED = False
    redis_client = None

logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        self.model = "gpt-4"
        self.cache_ttl = 3600  # 1 hour cache
        
    def _generate_cache_key(self, input_data: str) -> str:
        """Generate a cache key for the input data."""
        return f"ai_analysis:{hashlib.md5(input_data.encode()).hexdigest()}"
    
    def _get_cached_result(self, cache_key: str) -> Optional[str]:
        """Get cached analysis result."""
        if not CACHE_ENABLED:
            return None
        try:
            return redis_client.get(cache_key)
        except:
            return None
    
    def _cache_result(self, cache_key: str, result: str):
        """Cache analysis result."""
        if not CACHE_ENABLED:
            return
        try:
            redis_client.setex(cache_key, self.cache_ttl, result)
        except:
            pass

    async def analyze_behavior(self, session_data: str) -> Dict[str, Any]:
        """Analyze behavioral data and provide ASD likelihood assessment."""
        
        # Check cache first
        cache_key = self._generate_cache_key(session_data)
        cached_result = self._get_cached_result(cache_key)
        if cached_result:
            return json.loads(cached_result)
        
        system_prompt = """
        You are an expert AI assistant specializing in autism spectrum disorder (ASD) assessment through digital gameplay analysis. 
        Your role is to analyze behavioral patterns from interactive game sessions and provide evidence-based insights.

        Key behavioral indicators for ASD assessment:
        1. Repetitive behaviors and restricted interests
        2. Social communication patterns
        3. Sensory processing differences
        4. Attention and focus patterns
        5. Response to unexpected changes (surprise elements)
        6. Task completion patterns and error handling

        Provide your analysis in the following JSON format:
        {
            "asd_likelihood": <0-100 percentage>,
            "confidence_level": <"low"|"medium"|"high">,
            "key_indicators": [list of observed behavioral patterns],
            "analysis_summary": "<detailed explanation>",
            "recommendations": {
                "next_session_config": {
                    "difficulty_level": <1-5>,
                    "surprise_frequency": <0-1>,
                    "sensory_adjustments": ["visual", "auditory", "tactile"],
                    "focus_areas": [list of areas to emphasize]
                },
                "caregiver_notes": "<suggestions for parents/doctors>",
                "follow_up_needed": <true|false>
            },
            "peer_comparison": {
                "typical_completion_time": <seconds>,
                "typical_error_rate": <percentage>,
                "typical_surprise_reaction": "<description>"
            }
        }
        """

        user_prompt = f"""
        Analyze the following game session data for ASD behavioral indicators:
        
        Session Data: {session_data}
        
        Please provide a comprehensive analysis following the specified JSON format.
        """

        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse JSON response
            try:
                analysis_json = json.loads(analysis_text)
            except json.JSONDecodeError:
                # Fallback if GPT doesn't return proper JSON
                analysis_json = {
                    "asd_likelihood": 50,
                    "confidence_level": "low",
                    "key_indicators": ["Unable to parse analysis"],
                    "analysis_summary": analysis_text,
                    "recommendations": {
                        "next_session_config": {
                            "difficulty_level": 2,
                            "surprise_frequency": 0.3,
                            "sensory_adjustments": [],
                            "focus_areas": ["general_observation"]
                        },
                        "caregiver_notes": "Please review session data and consult with specialists.",
                        "follow_up_needed": True
                    },
                    "peer_comparison": {
                        "typical_completion_time": 60,
                        "typical_error_rate": 15,
                        "typical_surprise_reaction": "moderate attention shift"
                    }
                }
            
            # Cache the result
            self._cache_result(cache_key, json.dumps(analysis_json))
            
            return analysis_json
            
        except Exception as e:
            logger.error(f"AI analysis error: {str(e)}")
            return {
                "asd_likelihood": 50,
                "confidence_level": "low",
                "key_indicators": ["Analysis error occurred"],
                "analysis_summary": f"Unable to complete analysis due to error: {str(e)}",
                "recommendations": {
                    "next_session_config": {
                        "difficulty_level": 2,
                        "surprise_frequency": 0.3,
                        "sensory_adjustments": [],
                        "focus_areas": ["error_recovery"]
                    },
                    "caregiver_notes": "Technical error occurred. Please try again or contact support.",
                    "follow_up_needed": True
                },
                "peer_comparison": {
                    "typical_completion_time": 60,
                    "typical_error_rate": 15,
                    "typical_surprise_reaction": "moderate attention shift"
                }
            }

    async def generate_game_config(self, child_profile: Dict[str, Any], previous_sessions: list) -> Dict[str, Any]:
        """Generate personalized game configuration based on child profile and session history."""
        
        system_prompt = """
        You are an expert in adaptive game design for autism assessment. Generate personalized game configurations 
        that will provide optimal engagement and assessment opportunities based on the child's profile and previous session data.
        
        Consider:
        1. Age-appropriate challenges
        2. Special interests integration
        3. Sensory preferences
        4. Previous session performance
        5. Gradual difficulty progression
        
        Return JSON format:
        {
            "level_config": {
                "difficulty": <1-5>,
                "shapes": [list of shapes to use],
                "colors": [list of colors],
                "sounds": <true|false>,
                "animation_speed": <0.5-2.0>,
                "surprise_elements": [list of surprise types]
            },
            "assessment_focus": [list of behaviors to monitor],
            "session_duration": <minutes>,
            "break_intervals": <minutes>,
            "motivation_elements": [list based on special interests]
        }
        """
        
        user_prompt = f"""
        Child Profile: {json.dumps(child_profile)}
        Previous Sessions: {json.dumps(previous_sessions)}
        
        Generate an optimal game configuration for the next session.
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4,
                max_tokens=800
            )
            
            config_text = response.choices[0].message.content
            return json.loads(config_text)
            
        except Exception as e:
            logger.error(f"Game config generation error: {str(e)}")
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

# Global AI agent instance
ai_agent = AIAgent()

# Convenience functions for backward compatibility
async def analyze_behavior(session_data: str) -> Dict[str, Any]:
    """Analyze behavioral data using AI agent."""
    return await ai_agent.analyze_behavior(session_data)

async def generate_game_config(child_profile: Dict[str, Any], previous_sessions: list = None) -> Dict[str, Any]:
    """Generate game configuration using AI agent."""
    if previous_sessions is None:
        previous_sessions = []
    return await ai_agent.generate_game_config(child_profile, previous_sessions)