#!/usr/bin/env python3
"""
Analytics Reporter Agent

Generates weekly analytics reports:
1. Pulls data from all connected platforms
2. Calculates engagement metrics
3. Identifies top/bottom performing content
4. Generates actionable recommendations
5. Saves report to database
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
from prisma import Prisma

@dataclass
class PlatformAnalytics:
    platform_name: str
    followers: int
    follower_change: int
    posts: int
    impressions: int
    engagements: int
    engagement_rate: float
    top_post: Optional[Dict]
    worst_post: Optional[Dict]

@dataclass
class WeeklyReport:
    week_start: datetime
    week_end: datetime
    total_followers: int
    total_engagements: int
    avg_engagement_rate: float
    posts_published: int
    platform_breakdown: List[PlatformAnalytics]
    recommendations: List[str]

class AnalyticsReporterAgent:
    def __init__(self):
        self.db = Prisma()
        self.agent_name = "analytics-reporter"
    
    async def run(self, user_id: str):
        """Main entry - generate weekly analytics report"""
        await self.db.connect()
        
        try:
            # Calculate date range (last 7 days)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            print(f"Generating report for {start_date.date()} to {end_date.date()}")
            
            # Get all connected platforms
            platforms = await self.get_connected_platforms(user_id)
            
            # Gather analytics for each platform
            platform_analytics = []
            for platform in platforms:
                analytics = await self.analyze_platform(
                    user_id, 
                    platform, 
                    start_date, 
                    end_date
                )
                platform_analytics.append(analytics)
            
            # Calculate totals
            total_followers = sum(p.followers for p in platform_analytics)
            total_engagements = sum(p.engagements for p in platform_analytics)
            avg_engagement_rate = sum(p.engagement_rate for p in platform_analytics) / len(platform_analytics) if platform_analytics else 0
            total_posts = sum(p.posts for p in platform_analytics)
            
            # Generate recommendations
            recommendations = await self.generate_recommendations(platform_analytics)
            
            # Create report
            report = WeeklyReport(
                week_start=start_date,
                week_end=end_date,
                total_followers=total_followers,
                total_engagements=total_engagements,
                avg_engagement_rate=avg_engagement_rate,
                posts_published=total_posts,
                platform_breakdown=platform_analytics,
                recommendations=recommendations
            )
            
            # Save to database
            await self.save_report(user_id, report)
            
            # Log action
            await self.log_action(user_id)
            
            print(f"Report generated: {total_posts} posts, {total_engagements} engagements")
            
        finally:
            await self.db.disconnect()
    
    async def get_connected_platforms(self, user_id: str) -> List[Dict]:
        """Get all connected platforms"""
        platforms = await self.db.connectedplatform.find_many(
            where={"userId": user_id}
        )
        return [{
            "id": p.id,
            "platformName": p.platformName,
            "followerCount": p.followerCount or 0,
            "mode": p.mode
        } for p in platforms]
    
    async def analyze_platform(
        self, 
        user_id: str, 
        platform: Dict, 
        start_date: datetime, 
        end_date: datetime
    ) -> PlatformAnalytics:
        """Analyze a single platform's performance"""
        
        platform_id = platform["id"]
        platform_name = platform["platformName"]
        
        # Get posts from this week
        posts = await self.db.scheduledpost.find_many(
            where={
                "userId": user_id,
                "platformId": platform_id,
                "postedAt": {
                    "gte": start_date,
                    "lte": end_date
                },
                "status": "POSTED"
            }
        )
        
        # In production, fetch real metrics from platform APIs
        # For demo, generate realistic mock data
        num_posts = len(posts)
        
        # Mock analytics based on platform type
        if platform_name == "linkedin":
            impressions = num_posts * 2500 if num_posts > 0 else 0
            engagements = int(impressions * 0.038)  # 3.8% engagement
        elif platform_name == "threads":
            impressions = num_posts * 800 if num_posts > 0 else 0
            engagements = int(impressions * 0.042)  # 4.2% engagement
        else:
            impressions = num_posts * 1200 if num_posts > 0 else 0
            engagements = int(impressions * 0.025)  # 2.5% engagement
        
        engagement_rate = (engagements / impressions * 100) if impressions > 0 else 0
        
        # Get follower change (mock for demo)
        follower_change = 15 if platform_name == "linkedin" else (8 if platform_name == "threads" else 0)
        
        # Identify top and worst performing content
        top_post = None
        worst_post = None
        
        if posts:
            # Mock top post data
            top_post = {
                "content": posts[0].contentText[:100] + "..." if len(posts[0].contentText) > 100 else posts[0].contentText,
                "engagements": int(engagements * 0.3),  # Top post gets 30% of engagement
                "platform": platform_name
            }
            
            if len(posts) > 1:
                worst_post = {
                    "content": posts[-1].contentText[:100] + "..." if len(posts[-1].contentText) > 100 else posts[-1].contentText,
                    "engagements": int(engagements * 0.05),  # Worst gets 5%
                    "platform": platform_name
                }
        
        return PlatformAnalytics(
            platform_name=platform_name,
            followers=platform["followerCount"],
            follower_change=follower_change,
            posts=num_posts,
            impressions=impressions,
            engagements=engagements,
            engagement_rate=round(engagement_rate, 2),
            top_post=top_post,
            worst_post=worst_post
        )
    
    async def generate_recommendations(self, analytics: List[PlatformAnalytics]) -> List[str]:
        """Generate actionable recommendations based on data"""
        recommendations = []
        
        # Find best performing platform
        if analytics:
            best_platform = max(analytics, key=lambda x: x.engagement_rate)
            worst_platform = min(analytics, key=lambda x: x.engagement_rate)
            
            recommendations.append(
                f"Double down on {best_platform.platform_name.title()} — it's your highest performer at {best_platform.engagement_rate}% engagement."
            )
            
            if worst_platform.engagement_rate < 2.0 and worst_platform.posts > 3:
                recommendations.append(
                    f"Your {worst_platform.platform_name.title()} content isn't resonating. Try shorter, punchier posts with stronger hooks."
                )
        
        # Post frequency recommendation
        total_posts = sum(p.posts for p in analytics)
        if total_posts < 10:
            recommendations.append(
                "You're under-posting. Try increasing to at least 2 posts per day across platforms."
            )
        elif total_posts > 30:
            recommendations.append(
                "High volume this week. Make sure quality isn't suffering — engagement rate suggests room to optimize."
            )
        
        # Engagement rate recommendations
        avg_rate = sum(p.engagement_rate for p in analytics) / len(analytics) if analytics else 0
        if avg_rate < 2.0:
            recommendations.append(
                "Engagement is low. Try ending posts with questions and responding to comments within 1 hour."
            )
        elif avg_rate > 5.0:
            recommendations.append(
                "Excellent engagement! Whatever you're doing is working — document your approach."
            )
        
        # Follower growth
        total_growth = sum(p.follower_change for p in analytics)
        if total_growth < 10:
            recommendations.append(
                "Follower growth is flat. Consider cross-promoting your best content from high-performers."
            )
        elif total_growth > 50:
            recommendations.append(
                f"Strong growth (+{total_growth} followers). One of your posts went mini-viral — analyze what worked."
            )
        
        # Content mix recommendation
        platforms_with_posts = [p for p in analytics if p.posts > 0]
        if len(platforms_with_posts) == 1:
            recommendations.append(
                "You're only active on one platform. Consider repurposing content for your other connected accounts."
            )
        
        return recommendations[:5]  # Top 5 recommendations
    
    async def save_report(self, user_id: str, report: WeeklyReport):
        """Save report to database"""
        report_data = {
            "week_start": report.week_start.isoformat(),
            "week_end": report.week_end.isoformat(),
            "summary": {
                "total_followers": report.total_followers,
                "total_engagements": report.total_engagements,
                "avg_engagement_rate": round(report.avg_engagement_rate, 2),
                "posts_published": report.posts_published
            },
            "platforms": [
                {
                    "name": p.platform_name,
                    "followers": p.followers,
                    "follower_change": p.follower_change,
                    "posts": p.posts,
                    "impressions": p.impressions,
                    "engagements": p.engagements,
                    "engagement_rate": p.engagement_rate,
                    "top_post": p.top_post,
                    "worst_post": p.worst_post
                }
                for p in report.platform_breakdown
            ],
            "recommendations": report.recommendations
        }
        
        await self.db.analyticsreport.create({
            "userId": user_id,
            "reportJson": json.dumps(report_data),
            "dateRangeStart": report.week_start,
            "dateRangeEnd": report.week_end
        })
    
    async def log_action(self, user_id: str):
        """Log agent action"""
        await self.db.agentauditlog.create({
            "userId": user_id,
            "agentName": self.agent_name,
            "actionType": "generate_report",
            "contentSummary": "Weekly analytics report generated",
            "status": "SUCCESS"
        })

if __name__ == "__main__":
    import asyncio
    import sys
    
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not user_id:
        print("Usage: python analytics_reporter.py <user_id>")
        sys.exit(1)
    
    agent = AnalyticsReporterAgent()
    asyncio.run(agent.run(user_id))