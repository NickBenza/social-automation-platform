#!/usr/bin/env python3
"""
Content Generator Agent

Generates social media content based on:
- User's Voice Profile
- Trend reports
- Platform-specific optimization
- Historical performance
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import httpx
from prisma import Prisma

# LLM Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")

@dataclass
class GeneratedPost:
    platform: str
    content: str
    media_suggestions: Dict
    suggested_post_time: str
    hashtags: List[str]
    category: str
    confidence_score: float

class ContentGeneratorAgent:
    def __init__(self):
        self.db = Prisma()
        self.agent_name = "content-generator"
    
    async def run(self, user_id: str):
        """Main entry point - generates content for active platforms"""
        await self.db.connect()
        
        try:
            # Get user's voice profile
            voice_profile = await self.get_voice_profile(user_id)
            if not voice_profile:
                print(f"No voice profile found for user {user_id}")
                return
            
            # Get active platforms (DRAFT_CRON or AUTOMATE mode)
            platforms = await self.get_active_platforms(user_id)
            
            # Get recent trend report
            trends = await self.get_latest_trends(user_id)
            
            # Generate posts for each platform
            for platform in platforms:
                posts = await self.generate_posts_for_platform(
                    user_id=user_id,
                    platform=platform,
                    voice_profile=voice_profile,
                    trends=trends
                )
                
                # Save to draft queue or schedule for posting
                await self.save_posts(user_id, platform, posts)
                
                # Log the action
                await self.log_action(user_id, platform["platformName"], len(posts))
                
        finally:
            await self.db.disconnect()
    
    async def get_voice_profile(self, user_id: str) -> Optional[Dict]:
        """Fetch user's voice profile"""
        profile = await self.db.voiceprofile.find_unique(
            where={"userId": user_id}
        )
        return profile.profileJson if profile else None
    
    async def get_active_platforms(self, user_id: str) -> List[Dict]:
        """Get platforms in DRAFT_CRON or AUTOMATE mode"""
        platforms = await self.db.connectedplatform.find_many(
            where={
                "userId": user_id,
                "mode": {"in": ["DRAFT_CRON", "AUTOMATE"]}
            }
        )
        return [{
            "id": p.id,
            "platformName": p.platformName,
            "mode": p.mode,
            "config": p.config or {}
        } for p in platforms]
    
    async def get_latest_trends(self, user_id: str) -> Optional[Dict]:
        """Get most recent trend report"""
        trends = await self.db.trendreport.find_first(
            where={"userId": user_id},
            order={"createdAt": "desc"}
        )
        return trends.reportJson if trends else None
    
    async def generate_posts_for_platform(
        self,
        user_id: str,
        platform: Dict,
        voice_profile: Dict,
        trends: Optional[Dict]
    ) -> List[GeneratedPost]:
        """Generate platform-optimized posts"""
        
        platform_name = platform["platformName"]
        num_posts = platform["config"].get("posts_per_day", 2)
        
        posts = []
        for i in range(num_posts):
            post = await self.generate_single_post(
                platform=platform_name,
                voice_profile=voice_profile,
                trends=trends,
                post_number=i + 1
            )
            posts.append(post)
        
        return posts
    
    async def generate_single_post(
        self,
        platform: str,
        voice_profile: Dict,
        trends: Optional[Dict],
        post_number: int
    ) -> GeneratedPost:
        """Generate a single post using LLM"""
        
        # Build the prompt
        prompt = self.build_prompt(platform, voice_profile, trends, post_number)
        
        # Call local LLM
        response = await self.call_llm(prompt)
        
        # Parse and structure the response
        post_data = self.parse_llm_response(response)
        
        # Calculate confidence score
        confidence = self.calculate_confidence(post_data, voice_profile)
        
        return GeneratedPost(
            platform=platform,
            content=post_data["content"],
            media_suggestions=post_data.get("media", {}),
            suggested_post_time=self.calculate_post_time(platform, post_number),
            hashtags=post_data.get("hashtags", []),
            category=post_data.get("category", "ENGAGEMENT"),
            confidence_score=confidence
        )
    
    def build_prompt(
        self,
        platform: str,
        voice_profile: Dict,
        trends: Optional[Dict],
        post_number: int
    ) -> str:
        """Build the LLM prompt"""
        
        # Voice characteristics
        tone = voice_profile.get("overallTone", "professional")
        avg_length = voice_profile.get("avgPostLength", {}).get(platform, 200)
        emoji_usage = voice_profile.get("emojiUsage", "moderate")
        top_emojis = voice_profile.get("topEmojis", ["👍", "💡", "🚀"])
        signature_phrases = voice_profile.get("signaturePhrases", [])
        content_themes = voice_profile.get("contentThemes", [])
        
        # Platform-specific instructions
        platform_instructions = {
            "threads": "Keep it casual, conversational, lowercase acceptable. No hashtags needed. 1-3 sentences.",
            "x": "Punchy, under 280 chars. Can use 1-2 hashtags. Hook at start.",
            "linkedin": "Professional but conversational. Use line breaks. 3-5 paragraphs. End with question."
        }.get(platform, "Engaging, authentic voice.")
        
        # Trend context
        trend_context = ""
        if trends and trends.get("trends"):
            top_trends = trends["trends"][:3]
            trend_context = f"\nCurrent trends to potentially reference: {', '.join([t['title'] for t in top_trends])}"
        
        prompt = f"""You are a social media content creator with this voice:

TONE: {tone}
PLATFORM: {platform}
LENGTH: ~{avg_length} characters
EMOJI USAGE: {emoji_usage} (favorites: {', '.join(top_emojis)})
SIGNATURE PHRASES: {', '.join(signature_phrases) if signature_phrases else 'None'}
CONTENT THEMES: {', '.join(content_themes) if content_themes else 'general'}

PLATFORM INSTRUCTIONS: {platform_instructions}{trend_context}

Generate post #{post_number} for today. Return ONLY a JSON object with:
{{
    "content": "the post text",
    "hashtags": ["tag1", "tag2"],
    "category": "educational|promotional|engagement|storytelling",
    "media": {{"type": "image|video|carousel|none", "description": "what to show"}}
}}

Requirements:
- Match the voice tone exactly
- Be authentic, not corporate
- No engagement bait
- Make it actually valuable or entertaining"""
        
        return prompt
    
    async def call_llm(self, prompt: str) -> str:
        """Call local Ollama instance"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.8,
                            "num_predict": 500
                        }
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "")
        except Exception as e:
            print(f"LLM call failed: {e}")
            # Fallback to template
            return self.generate_template_post()
    
    def parse_llm_response(self, response: str) -> Dict:
        """Parse LLM JSON response"""
        try:
            # Extract JSON from response
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        # Fallback
        return {
            "content": response.strip()[:500],
            "hashtags": [],
            "category": "ENGAGEMENT",
            "media": {"type": "none", "description": ""}
        }
    
    def calculate_confidence(self, post_data: Dict, voice_profile: Dict) -> float:
        """Calculate confidence score (0-1)"""
        score = 0.7  # Base score
        
        # Boost for good content length
        content = post_data.get("content", "")
        if 50 < len(content) < 500:
            score += 0.1
        
        # Boost for hashtags (if expected)
        if post_data.get("hashtags"):
            score += 0.1
        
        # Boost for media suggestion
        if post_data.get("media", {}).get("type") != "none":
            score += 0.1
        
        return min(score, 1.0)
    
    def calculate_post_time(self, platform: str, post_number: int) -> str:
        """Calculate optimal post time"""
        tomorrow = datetime.now() + timedelta(days=1)
        
        # Simple schedule: morning and evening
        times = ["08:00", "18:30"]
        time_str = times[post_number - 1] if post_number <= len(times) else "12:00"
        
        hour, minute = map(int, time_str.split(":"))
        post_time = tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        return post_time.isoformat()
    
    def generate_template_post(self) -> str:
        """Fallback template if LLM fails"""
        return json.dumps({
            "content": "Building something cool with AI agents today. The future of automation is here and it's wild! 🚀",
            "hashtags": ["AI", "automation", "building"],
            "category": "ENGAGEMENT",
            "media": {"type": "none", "description": ""}
        })
    
    async def save_posts(self, user_id: str, platform: Dict, posts: List[GeneratedPost]):
        """Save generated posts to database"""
        for post in posts:
            await self.db.draftqueue.create({
                "userId": user_id,
                "platformId": platform["id"],
                "contentText": post.content,
                "mediaSuggestions": json.dumps(post.media_suggestions),
                "suggestedPostTime": datetime.fromisoformat(post.suggested_post_time),
                "hashtags": post.hashtags,
                "category": post.category.upper(),
                "confidenceScore": post.confidence_score,
                "status": "PENDING",
                "createdByAgent": self.agent_name
            })
    
    async def log_action(self, user_id: str, platform_name: str, posts_count: int):
        """Log agent action to audit log"""
        await self.db.agentauditlog.create({
            "userId": user_id,
            "agentName": self.agent_name,
            "actionType": "generate_posts",
            "platformName": platform_name,
            "contentSummary": f"Generated {posts_count} posts",
            "status": "SUCCESS"
        })

# Run if called directly
if __name__ == "__main__":
    import asyncio
    import sys
    
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not user_id:
        print("Usage: python content_generator.py <user_id>")
        sys.exit(1)
    
    agent = ContentGeneratorAgent()
    asyncio.run(agent.run(user_id))