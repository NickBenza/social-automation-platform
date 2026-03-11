import { NextResponse } from 'next/server'
import { prisma } from "@social-platform/database";

export async function GET() {
  try {
    // For demo, using hardcoded user ID (in production, get from session)
    const userId = 'cmmmm5nr80000bmzd5l7n3xtu'

    // Get all stats in parallel
    const [platforms, drafts, totalFollowers, agentLogs] = await Promise.all([
      // Get platforms
      prisma.connectedPlatform.findMany({
        where: { userId },
        select: {
          id: true,
          platformName: true,
          mode: true,
          platformUsername: true,
          followerCount: true,
          connectedAt: true
        }
      }),
      
      // Get pending drafts count
      prisma.draftQueue.count({
        where: { 
          userId,
          status: 'PENDING'
        }
      }),
      
      // Get total followers
      prisma.connectedPlatform.aggregate({
        where: { userId },
        _sum: { followerCount: true }
      }),
      
      // Get recent agent activity
      prisma.agentAuditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          agentName: true,
          actionType: true,
          platformName: true,
          status: true,
          createdAt: true
        }
      })
    ])

    // Get agent schedules
    const schedules = await prisma.agentSchedule.findMany({
      where: { userId },
      select: {
        agentName: true,
        enabled: true,
        lastRunAt: true,
        nextRunAt: true
      }
    })

    // Format agent status
    const agentStatus = [
      {
        name: 'Content Generator',
        status: schedules.find(s => s.agentName === 'content-generator')?.enabled ? 'active' : 'paused',
        lastRun: schedules.find(s => s.agentName === 'content-generator')?.lastRunAt 
          ? formatTimeAgo(schedules.find(s => s.agentName === 'content-generator')!.lastRunAt!)
          : 'Never',
        nextRun: schedules.find(s => s.agentName === 'content-generator')?.nextRunAt
          ? formatTimeUntil(schedules.find(s => s.agentName === 'content-generator')!.nextRunAt!)
          : 'Not scheduled',
        tasksCompleted: agentLogs.filter(l => l.agentName === 'content-generator').length
      },
      {
        name: 'Engagement Manager',
        status: schedules.find(s => s.agentName === 'engagement-manager')?.enabled ? 'active' : 'paused',
        lastRun: schedules.find(s => s.agentName === 'engagement-manager')?.lastRunAt
          ? formatTimeAgo(schedules.find(s => s.agentName === 'engagement-manager')!.lastRunAt!)
          : 'Never',
        nextRun: schedules.find(s => s.agentName === 'engagement-manager')?.nextRunAt
          ? formatTimeUntil(schedules.find(s => s.agentName === 'engagement-manager')!.nextRunAt!)
          : 'Not scheduled',
        tasksCompleted: agentLogs.filter(l => l.agentName === 'engagement-manager').length
      },
      {
        name: 'Trend Scanner',
        status: schedules.find(s => s.agentName === 'trend-scanner')?.enabled ? 'active' : 'paused',
        lastRun: schedules.find(s => s.agentName === 'trend-scanner')?.lastRunAt
          ? formatTimeAgo(schedules.find(s => s.agentName === 'trend-scanner')!.lastRunAt!)
          : 'Never',
        nextRun: schedules.find(s => s.agentName === 'trend-scanner')?.nextRunAt
          ? formatTimeUntil(schedules.find(s => s.agentName === 'trend-scanner')!.nextRunAt!)
          : 'Not scheduled',
        tasksCompleted: agentLogs.filter(l => l.agentName === 'trend-scanner').length
      },
      {
        name: 'Analytics Reporter',
        status: schedules.find(s => s.agentName === 'analytics-reporter')?.enabled ? 'active' : 'paused',
        lastRun: schedules.find(s => s.agentName === 'analytics-reporter')?.lastRunAt
          ? formatTimeAgo(schedules.find(s => s.agentName === 'analytics-reporter')!.lastRunAt!)
          : 'Never',
        nextRun: schedules.find(s => s.agentName === 'analytics-reporter')?.nextRunAt
          ? formatTimeUntil(schedules.find(s => s.agentName === 'analytics-reporter')!.nextRunAt!)
          : 'Not scheduled',
        tasksCompleted: agentLogs.filter(l => l.agentName === 'analytics-reporter').length
      }
    ]

    // Calculate posts this week (mock for now - would query scheduled_posts)
    const postsThisWeek = 20

    // Calculate engagement rate (mock for now)
    const engagementRate = 4.1

    return NextResponse.json({
      stats: {
        totalFollowers: totalFollowers._sum.followerCount || 0,
        postsThisWeek,
        engagementRate,
        pendingDrafts: drafts,
        tasksCompleted: agentLogs.length
      },
      platforms: platforms.map(p => ({
        id: p.id,
        name: p.platformName.charAt(0).toUpperCase() + p.platformName.slice(1),
        icon: getPlatformIcon(p.platformName),
        username: p.platformUsername,
        mode: p.mode.toLowerCase(),
        followers: p.followerCount,
        postsThisWeek: Math.floor(Math.random() * 15) + 5, // Mock for now
        engagementRate: (Math.random() * 3 + 2).toFixed(1), // Mock for now
        lastPost: '2 hours ago' // Mock for now
      })),
      agents: agentStatus,
      recentActivity: agentLogs.slice(0, 10)
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    'threads': '🧵',
    'x': '𝕏',
    'linkedin': '💼',
    'instagram': '📸',
    'facebook': '👥',
    'tiktok': '🎵',
    'youtube': '▶️',
    'bluesky': '🦋',
    'mastodon': '🐘',
    'pinterest': '📌',
    'reddit': '👽'
  }
  return icons[platform] || '🌐'
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} mins ago`
  if (hours < 24) return `${hours} hours ago`
  return `${days} days ago`
}

function formatTimeUntil(date: Date): string {
  const now = new Date()
  const diff = new Date(date).getTime() - now.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 60) return `in ${minutes} mins`
  if (hours < 24) return `in ${hours} hours`
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}