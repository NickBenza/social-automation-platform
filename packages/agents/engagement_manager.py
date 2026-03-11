#!/usr/bin/env python3
"""
Engagement Manager Agent

Monitors comments across all platforms and:
1. Fetches new comments since last check
2. Analyzes sentiment and intent
3. Drafts appropriate replies matching user's voice
4. Saves replies to queue (for manual approval) or posts directly (in automate mode)
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import httpx
from prisma import Prisma

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")

@dataclass
class AnalyzedComment:
    comment_id: str
    post_id: str
    author_name: str
    content: str
    sentiment_score: float
    sentiment_label: str
    intent: str
    priority: str
    suggested_reply: Optional[str] = None

class EngagementManagerAgent:
    def __init__(self):
        self.db = Prisma()
        self.agent_name = "engagement-manager"
    
    async def run(self, user_id: str):
        """Main entry - check all active platforms for new comments"""
        await self.db.connect()
        
        try:
            # Get user's voice profile
            voice_profile = await self.get_voice_profile(user_id)
            
            # Get platforms in DRAFT_CRON or AUTOMATE mode
            platforms = await self.get_active_platforms(user_id)
            
            total_comments = 0
            total_replies = 0
            
            for platform in platforms:
                # Fetch new comments from platform
                comments = await self.fetch_comments(platform)
                total_comments += len(comments)
                
                # Analyze each comment
                analyzed = await self.analyze_comments(comments, voice_profile)
                
                # Generate replies for worthy comments
                for comment in analyzed:
                    if self.should_reply(comment):
                        reply = await self.generate_reply(comment, voice_profile)
                        comment.suggested_reply = reply
                        
                        # Save to database
                        await self.save_comment_and_reply(user_id, platform, comment)
                        total_replies += 1
                
                # Log action
                await self.log_action(user_id, platform["platformName"], len(comments), total_replies)
            
            print(f"Checked {len(platforms)} platforms, found {total_comments} comments, drafted {total_replies} replies")
            
        finally:
            await self.db.disconnect()
    
    async def get_voice_profile(self, user_id: str) -> Optional[Dict]:
        """Fetch user's voice profile"""
        profile = await self.db.voiceprofile.find_unique(
            where={"userId": user_id}
        )
        return json.loads(profile.profileJson) if profile else None
    
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
            "oauthToken": p.oauthToken,
            "config": json.loads(p.config) if p.config else {}
        } for p in platforms]
    
    async def fetch_comments(self, platform: Dict) -> List[Dict]:
        """Fetch new comments from the platform"""
        # Get last check time
        last_check = await self.db.agentauditlog.find_first(
            where={
                "agentName": self.agent_name,
                "platformName": platform["platformName"]
            },
            order={"createdAt": "desc"}
        )
        
        since = last_check.createdAt if last_check else datetime.now() - timedelta(hours=24)
        
        # For demo/development, return mock comments
        # In production, this would call the platform's API
        if platform["platformName"] == "threads":
            return self.mock_threads_comments()
        
        return []
    
    def mock_threads_comments(self) -> List[Dict]:
        """Mock comments for testing"""
        return [
            {
                "id": "comment_1",
                "post_id": "post_123",
                "author_name": "ski_enthusiast",
                "content": "This is so true! I see people in jeans all the time at my local mountain.",
                "created_at": datetime.now() - timedelta(hours=2)
            },
            {
                "id": "comment_2", 
                "post_id": "post_123",
                "author_name": "troll_account",
                "content": "you suck at skiing bro",
                "created_at": datetime.now() - timedelta(hours=1)
            },
            {
                "id": "comment_3",
                "post_id": "post_123", 
                "author_name": "new_skier_2024",
                "content": "What kind of boots do you recommend for beginners?",
                "created_at": datetime.now() - timedelta(minutes=30)
            }
        ]
    
    async def analyze_comments(self, comments: List[Dict], voice_profile: Dict) -> List[AnalyzedComment]:
        """Analyze sentiment and intent of each comment"""
        analyzed = []
        
        for comment in comments:
            sentiment_score, sentiment_label = await self.analyze_sentiment(comment["content"])
            intent = await self.classify_intent(comment["content"])
            priority = self.calculate_priority(sentiment_score, intent)
            
            analyzed.append(AnalyzedComment(
                comment_id=comment["id"],
                post_id=comment["post_id"],
                author_name=comment["author_name"],
                content=comment["content"],
                sentiment_score=sentiment_score,
                sentiment_label=sentiment_label,
                intent=intent,
                priority=priority
            ))
        
        return analyzed
    
    async def analyze_sentiment(self, text: str) -> Tuple[float, str]:
        """Analyze sentiment of text (-1 to 1)"""
        prompt = f"""Analyze the sentiment of this comment. Return ONLY a JSON object:
{{
    "score": <number between -1 and 1>,
    "label": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "HOSTILE"
}}

Comment: "{text}"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3}
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                # Parse JSON from response
                result = json.loads(self.extract_json(data.get("response", "{}")))
                return result.get("score", 0.0), result.get("label", "NEUTRAL")
        except:
            # Fallback to simple heuristic
            text_lower = text.lower()
            if any(w in text_lower for w in ["suck", "bad", "terrible", "hate"]):
                return -0.8, "NEGATIVE"
            elif any(w in text_lower for w in ["love", "great", "awesome", "thanks"]):
                return 0.8, "POSITIVE"
            return 0.0, "NEUTRAL"
    
    async def classify_intent(self, text: str) -> str:
        """Classify the intent of the comment"""
        prompt = f"""Classify the intent of this comment. Return ONLY the intent type:
- QUESTION (asking something)
- COMPLIMENT (saying something nice)
- COMPLAINT (complaining/criticizing)
- SPAM (promotional/unrelated)
- TROLL (hostile/bad faith)
- COLLABORATION (wants to work together)
- CUSTOMER_INQUIRY (asking about product/service)
- OTHER

Comment: "{text}"

Intent:"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3}
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                intent = data.get("response", "OTHER").strip().upper()
                
                valid_intents = ["QUESTION", "COMPLIMENT", "COMPLAINT", "SPAM", "TROLL", "COLLABORATION", "CUSTOMER_INQUIRY", "OTHER"]
                return intent if intent in valid_intents else "OTHER"
        except:
            return "OTHER"
    
    def calculate_priority(self, sentiment: float, intent: str) -> str:
        """Calculate priority based on sentiment and intent"""
        if intent in ["TROLL", "SPAM"]:
            return "LOW"
        if sentiment < -0.6 or intent == "COMPLAINT":
            return "ESCALATE"
        if intent == "CUSTOMER_INQUIRY":
            return "HIGH"
        if intent == "QUESTION":
            return "MEDIUM"
        return "LOW"
    
    def should_reply(self, comment: AnalyzedComment) -> bool:
        """Determine if we should reply to this comment"""
        # Skip trolls and spam
        if comment.intent in ["TROLL", "SPAM"]:
            return False
        
        # Skip very negative comments (escalate to human)
        if comment.sentiment_score < -0.6:
            return False
        
        # Reply to questions, compliments, collaborations
        if comment.intent in ["QUESTION", "COMPLIMENT", "COLLABORATION", "CUSTOMER_INQUIRY"]:
            return True
        
        return False
    
    async def generate_reply(self, comment: AnalyzedComment, voice_profile: Dict) -> str:
        """Generate a reply matching the user's voice"""
        tone = voice_profile.get("overallTone", "casual-professional")
        
        # Different prompts based on intent
        if comment.intent == "QUESTION":
            prompt = f"""Reply to this question helpfully in a {tone} tone. Be concise and genuine:

Question: "{comment.content}"

Your reply (1-2 sentences):"""
        elif comment.intent == "COMPLIMENT":
            prompt = f"""Reply to this compliment graciously in a {tone} tone:

Compliment: "{comment.content}"

Your reply (1 sentence, humble but appreciative):"""
        else:
            prompt = f"""Reply to this comment in a {tone} tone:

Comment: "{comment.content}"

Your reply (1-2 sentences):"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.7, "num_predict": 100}
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "Thanks for the comment!").strip()
        except:
            # Fallback replies
            fallbacks = {
                "QUESTION": "Great question! I usually recommend starting with lessons to build good habits.",
                "COMPLIMENT": "Thanks so much! Really appreciate that.",
                "COLLABORATION": "Would love to connect! Send me a DM and let's chat.",
                "CUSTOMER_INQUIRY": "Happy to help! Can you share more details about what you're looking for?"
            }
            return fallbacks.get(comment.intent, "Thanks for reaching out!")
    
    async def save_comment_and_reply(self, user_id: str, platform: Dict, comment: AnalyzedComment):
        """Save comment and suggested reply to database"""
        # First save the comment
        saved_comment = await self.db.commenttracked.create({
            "userId": user_id,
            "platformId": platform["id"],
            "postPlatformId": comment.post_id,
            "commentPlatformId": comment.comment_id,
            "authorName": comment.author_name,
            "commentText": comment.content,
            "sentimentScore": comment.sentiment_score,
            "sentimentLabel": comment.sentiment_label,
            "intentClassification": comment.intent,
            "priority": comment.priority,
            "status": "NEW"
        })
        
        # Then save the suggested reply
        if comment.suggested_reply:
            await self.db.replyqueue.create({
                "commentId": saved_comment.id,
                "suggestedReplyText": comment.suggested_reply,
                "mode": "SUGGESTION",  # or AUTO_POSTED depending on platform mode
                "status": "PENDING"
            })
    
    async def log_action(self, user_id: str, platform_name: str, comments_found: int, replies_drafted: int):
        """Log agent action"""
        await self.db.agentauditlog.create({
            "userId": user_id,
            "agentName": self.agent_name,
            "actionType": "check_comments",
            "platformName": platform_name,
            "contentSummary": f"Found {comments_found} comments, drafted {replies_drafted} replies",
            "status": "SUCCESS"
        })
    
    def extract_json(self, text: str) -> str:
        """Extract JSON from text"""
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return text[start:end]
        return "{}"

if __name__ == "__main__":
    import asyncio
    import sys
    
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not user_id:
        print("Usage: python engagement_manager.py <user_id>")
        sys.exit(1)
    
    agent = EngagementManagerAgent()
    asyncio.run(agent.run(user_id))