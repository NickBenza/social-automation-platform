import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const userId = 'cmmmm5nr80000bmzd5l7n3xtu'

    const drafts = await prisma.draftQueue.findMany({
      where: { userId },
      include: {
        platform: {
          select: {
            platformName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      drafts: drafts.map(d => ({
        id: d.id,
        platform: d.platform.platformName.charAt(0).toUpperCase() + d.platform.platformName.slice(1),
        content: d.contentText,
        confidence: d.confidenceScore,
        suggestedTime: d.suggestedPostTime 
          ? new Date(d.suggestedPostTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Not scheduled',
        status: d.status.toLowerCase()
      }))
    })

  } catch (error) {
    console.error('Drafts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    )
  }
}