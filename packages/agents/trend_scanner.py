#!/usr/bin/env python3
"""
Trend Scanner Agent

Scans multiple sources for trending topics relevant to the user's niche:
1. X (Twitter) trending topics
2. Reddit popular posts
3. Google Trends
4. Industry news sources

Generates a structured report with:
- Trending topics
- Content angle suggestions
- Platform recommendations
- Urgency scores
"""

import json
import os
import feedparser
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
import httpx
from prisma import Prisma

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")

@dataclass
class TrendItem:
    title: str
    description: str
    source: str
    url: Optional[str]
    relevance_score: float
    urgency: str  # 'high', 'medium', 'low'
    suggested_angle: str
    best_platform: str

class TrendScannerAgent:
    def __init__(self):
        self.db = Prisma()
        self.agent_name = "trend-scanner"
    
    async def run(self, user_id: str):
        """Main entry - scan all sources and generate trend report"""
        await self.db.connect()
        
        try:
            # Get user's content themes from voice profile
            voice_profile = await self.get_voice_profile(user_id)
            content_themes = voice_profile.get("contentThemes", ["AI", "recruiting", "technology"]) if voice_profile else ["AI", "recruiting"]
            
            all_trends = []
            
            # Scan multiple sources
            print("Scanning X/Twitter trends...")
            x_trends = await self.scan_x_trends(content_themes)
            all_trends.extend(x_trends)
            
            print("Scanning Reddit...")
            reddit_trends = await self.scan_reddit(content_themes)
            all_trends.extend(reddit_trends)
            
            print("Scanning news feeds...")
            news_trends = await self.scan_news_feeds(content_themes)
            all_trends.extend(news_trends)
            
            # Filter and rank by relevance
            ranked_trends = self.rank_trends(all_trends, content_themes)
            
            # Generate content angles using LLM
            for trend in ranked_trends:
                trend.suggested_angle = await self.generate_content_angle(trend, voice_profile)
            
            # Save report to database
            await self.save_report(user_id, ranked_trends)
            
            # Log action
            await self.log_action(user_id, len(ranked_trends))
            
            print(f"Found {len(ranked_trends)} relevant trends")
            
        finally:
            await self.db.disconnect()
    
    async def get_voice_profile(self, user_id: str) -> Optional[Dict]:
        """Fetch user's voice profile"""
        profile = await self.db.voiceprofile.find_unique(
            where={"userId": user_id}
        )
        return json.loads(profile.profileJson) if profile else None
    
    async def scan_x_trends(self, themes: List[str]) -> List[TrendItem]:
        """Scan X/Twitter for trending topics"""
        # In production, use X API v2
        # For demo, return mock trends
        
        mock_trends = [
            {
                "title": "AI Hiring Trends 2026",
                "description": "Companies shifting from pedigree to shipping velocity",
                "source": "x_trending"
            },
            {
                "title": "Remote Work Policies",
                "description": "Tech companies updating return-to-office mandates",
                "source": "x_trending"
            },
            {
                "title": "OpenClaw Automation",
                "description": "Developers building 24/7 AI agents for business tasks",
                "source": "x_trending"
            },
            {
                "title": "Ski Season Conditions",
                "description": "Epic snowfall across Tahoe and Rockies",
                "source": "x_trending"
            }
        ]
        
        trends = []
        for item in mock_trends:
            relevance = self.calculate_relevance(item["title"] + " " + item["description"], themes)
            trends.append(TrendItem(
                title=item["title"],
                description=item["description"],
                source="X/Twitter",
                url=None,
                relevance_score=relevance,
                urgency="medium",
                suggested_angle="",
                best_platform=self.suggest_platform(item["title"])
            ))
        
        return trends
    
    async def scan_reddit(self, themes: List[str]) -> List[TrendItem]:
        """Scan Reddit for popular posts"""
        # Subreddits relevant to user's themes
        subreddits = ["recruiting", "humanresources", "artificial", "MachineLearning", "skiing", "snowboarding"]
        
        mock_posts = [
            {
                "title": "What's your biggest hiring mistake in 2025?",
                "description": "Discussion about lessons learned from bad hires",
                "subreddit": "recruiting",
                "upvotes": 2400
            },
            {
                "title": "AI agents are replacing SDRs - my experience",
                "description": "First-hand account of sales automation impact",
                "subreddit": "sales",
                "upvotes": 5600
            },
            {
                "title": "Best ski resorts for powder this season?",
                "description": "Community recommendations for 2026 season",
                "subreddit": "skiing",
                "upvotes": 890
            }
        ]
        
        trends = []
        for post in mock_posts:
            relevance = self.calculate_relevance(post["title"] + " " + post["description"], themes)
            # Boost relevance for high-engagement posts
            if post.get("upvotes", 0) > 5000:
                relevance = min(relevance * 1.2, 1.0)
            
            trends.append(TrendItem(
                title=post["title"],
                description=post["description"],
                source=f"r/{post['subreddit']}",
                url=None,
                relevance_score=relevance,
                urgency="high" if post.get("upvotes", 0) > 3000 else "medium",
                suggested_angle="",
                best_platform=self.suggest_platform(post["title"])
            ))
        
        return trends
    
    async def scan_news_feeds(self, themes: List[str]) -> List[TrendItem]:
        """Scan RSS news feeds"""
        # Mock news items
        news_items = [
            {
                "title": "Anthropic Releases New Claude Features for Enterprise",
                "description": "Major updates to AI assistant capabilities for business automation",
                "source": "TechCrunch"
            },
            {
                "title": "Hiring Slows in Tech but AI Roles Surge",
                "description": "Job market analysis shows divergence in traditional vs AI positions",
                "source": "Reuters"
            },
            {
                "title": "Tahoe Ski Resorts Report Record Season",
                "description": "Over 600 inches of snow this season, best in decade",
                "source": "Local News"
            }
        ]
        
        trends = []
        for item in news_items:
            relevance = self.calculate_relevance(item["title"] + " " + item["description"], themes)
            trends.append(TrendItem(
                title=item["title"],
                description=item["description"],
                source=item["source"],
                url=None,
                relevance_score=relevance,
                urgency="high" if "Release" in item["title"] or "Record" in item["title"] else "medium",
                suggested_angle="",
                best_platform="LinkedIn" if "Hiring" in item["title"] or "Enterprise" in item["title"] else "X"
            ))
        
        return trends
    
    def calculate_relevance(self, text: str, themes: List[str]) -> float:
        """Calculate relevance score (0-1) based on theme overlap"""
        text_lower = text.lower()
        
        # Theme keywords
        theme_keywords = {
            "AI": ["ai", "artificial intelligence", "machine learning", "claude", "gpt", "automation", "agent"],
            "recruiting": ["hiring", "recruiting", "talent", "interview", "candidate", "job"],
            "technology": ["tech", "software", "startup", "enterprise"],
            "skiing": ["ski", "snowboard", "powder", "resort", "tahoe", "mountain"]
        }
        
        score = 0.0
        for theme in themes:
            keywords = theme_keywords.get(theme, [theme.lower()])
            for keyword in keywords:
                if keyword in text_lower:
                    score += 0.2
        
        return min(score, 1.0)
    
    def suggest_platform(self, title: str) -> str:
        """Suggest best platform for this trend"""
        title_lower = title.lower()
        
        if any(w in title_lower for w in ["hiring", "enterprise", "business", "professional"]):
            return "LinkedIn"
        elif any(w in title_lower for w in ["ski", "snow", "powder", "casual", "lifestyle"]):
            return "Threads"
        else:
            return "X"
    
    def rank_trends(self, trends: List[TrendItem], themes: List[str]) -> List[TrendItem]:
        """Rank trends by relevance and filter low-quality"""
        # Sort by relevance score
        sorted_trends = sorted(trends, key=lambda x: x.relevance_score, reverse=True)
        
        # Filter out low relevance (below 0.3)
        filtered = [t for t in sorted_trends if t.relevance_score >= 0.3]
        
        # Take top 10
        return filtered[:10]
    
    async def generate_content_angle(self, trend: TrendItem, voice_profile: Dict) -> str:
        """Use LLM to generate content angle suggestion"""
        tone = voice_profile.get("overallTone", "professional") if voice_profile else "professional"
        
        prompt = f"""Given this trending topic, suggest a content angle for a {tone} social media post.

Trend: {trend.title}
Description: {trend.description}
Platform: {trend.best_platform}

Suggest:
1. Hook/Opening line
2. Key insight or take
3. Call to action or question

Keep it brief (2-3 sentences total):"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.8, "num_predict": 150}
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "Share your take on this trend").strip()
        except:
            return f"Share your perspective on {trend.title} - what does this mean for your audience?"
    
    async def save_report(self, user_id: str, trends: List[TrendItem]):
        """Save trend report to database"""
        report_data = {
            "generated_at": datetime.now().isoformat(),
            "trends": [
                {
                    "title": t.title,
                    "description": t.description,
                    "source": t.source,
                    "relevance": t.relevance_score,
                    "urgency": t.urgency,
                    "suggested_angle": t.suggested_angle,
                    "best_platform": t.best_platform
                }
                for t in trends
            ]
        }
        
        await self.db.trendreport.create({
            "userId": user_id,
            "reportJson": json.dumps(report_data)
        })
    
    async def log_action(self, user_id: str, trends_found: int):
        """Log agent action"""
        await self.db.agentauditlog.create({
            "userId": user_id,
            "agentName": self.agent_name,
            "actionType": "scan_trends",
            "contentSummary": f"Found {trends_found} relevant trends",
            "status": "SUCCESS"
        })

if __name__ == "__main__":
    import asyncio
    import sys
    
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not user_id:
        print("Usage: python trend_scanner.py <user_id>")
        sys.exit(1)
    
    agent = TrendScannerAgent()
    asyncio.run(agent.run(user_id))