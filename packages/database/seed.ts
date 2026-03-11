import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test user (you)
  const user = await prisma.user.create({
    data: {
      email: 'macbenz@gmail.com',
      name: 'Nick Benza',
      settings: JSON.stringify({
        timezone: 'America/Los_Angeles',
        notifications: { email: true, push: false }
      })
    }
  })

  console.log('Created user:', user.id)

  // Create voice profile
  const voiceProfile = await prisma.voiceProfile.create({
    data: {
      userId: user.id,
      profileJson: JSON.stringify({
        overallTone: 'casual-professional',
        avgPostLength: { threads: 180, linkedin: 850 },
        emojiUsage: 'moderate',
        topEmojis: ['🚀', '💡', '👇', '📊', '🧠'],
        hashtagStyle: '2-4 per post, mix of branded and trending',
        vocabularyLevel: 'accessible but industry-informed',
        signaturePhrases: ['here\'s the thing', 'does this match what you\'re seeing'],
        contentThemes: ['AI recruiting', 'hiring trends', 'automation'],
        humorStyle: 'occasional rage-bait, ironic',
        ctaStyle: 'soft ask, ends with question',
        avoidPatterns: ['corporate jargon', 'engagement bait'],
        platformAdaptations: {
          linkedin: 'data-driven, emoji-structured, no hype',
          threads: 'lowercase, punchy, multiple exclamation points'
        }
      }),
      samplePosts: JSON.stringify([
        'skiers who stop in the middle of the run should have their passes pulled!!!',
        'the "i only ski powder" crowd is just admitting they can\'t handle ice'
      ])
    }
  })

  console.log('Created voice profile:', voiceProfile.id)

  // Create connected platforms
  const threads = await prisma.connectedPlatform.create({
    data: {
      userId: user.id,
      platformName: 'threads',
      mode: 'DRAFT_CRON',
      platformUsername: '@glade_runner85',
      followerCount: 390,
      config: JSON.stringify({ postsPerDay: 2, schedule: ['08:00', '18:30'] }),
      guardrails: JSON.stringify({
        maxPostsPerDay: 2,
        bannedTopics: ['politics', 'religion'],
        sentimentThreshold: 0.8
      })
    }
  })

  const linkedin = await prisma.connectedPlatform.create({
    data: {
      userId: user.id,
      platformName: 'linkedin',
      mode: 'AUTOMATE',
      platformUsername: 'Nick Benza',
      followerCount: 14757,
      config: JSON.stringify({ postsPerDay: 1, schedule: ['08:00'] }),
      guardrails: JSON.stringify({
        maxPostsPerDay: 1,
        bannedTopics: [],
        sentimentThreshold: 0.7
      })
    }
  })

  const x = await prisma.connectedPlatform.create({
    data: {
      userId: user.id,
      platformName: 'x',
      mode: 'OFF',
      platformUsername: '@aiHiringRadar',
      followerCount: 0,
      config: JSON.stringify({ postsPerDay: 2 }),
      guardrails: JSON.stringify({
        maxPostsPerDay: 2,
        bannedTopics: [],
        sentimentThreshold: 0.8
      })
    }
  })

  console.log('Created platforms:', threads.id, linkedin.id, x.id)

  // Create some draft posts
  const draft1 = await prisma.draftQueue.create({
    data: {
      userId: user.id,
      platformId: threads.id,
      contentText: 'ski boots are designed by people who have never stood in a lift line for 20 minutes\n\nno breathable material. no flex zone. just plastic coffins for your feet.\n\nand we pay $800 for this.',
      hashtags: JSON.stringify(['#skiing', '#snowboarding']),
      category: 'ENGAGEMENT',
      confidenceScore: 0.92,
      status: 'PENDING',
      suggestedPostTime: new Date('2026-03-11T18:30:00'),
      createdByAgent: 'content-generator'
    }
  })

  const draft2 = await prisma.draftQueue.create({
    data: {
      userId: user.id,
      platformId: linkedin.id,
      contentText: 'The best candidates never apply through your ATS.\n\nAfter 14 years in recruiting, I\'ve noticed a pattern: the people companies actually want are rarely the ones flooding their job boards...',
      hashtags: JSON.stringify(['#Recruiting', '#Hiring', '#TalentAcquisition']),
      category: 'EDUCATIONAL',
      confidenceScore: 0.89,
      status: 'APPROVED',
      suggestedPostTime: new Date('2026-03-12T08:00:00'),
      createdByAgent: 'content-generator'
    }
  })

  console.log('Created drafts:', draft1.id, draft2.id)

  // Create agent schedules
  const schedules = await prisma.agentSchedule.createMany({
    data: [
      {
        userId: user.id,
        agentName: 'content-generator',
        cronExpression: '0 8,18 * * *',
        enabled: true,
        nextRunAt: new Date('2026-03-11T18:00:00')
      },
      {
        userId: user.id,
        agentName: 'engagement-manager',
        cronExpression: '*/30 * * * *',
        enabled: true,
        nextRunAt: new Date('2026-03-11T13:30:00')
      },
      {
        userId: user.id,
        agentName: 'trend-scanner',
        cronExpression: '0 */4 * * *',
        enabled: true,
        nextRunAt: new Date('2026-03-11T16:00:00')
      },
      {
        userId: user.id,
        agentName: 'analytics-reporter',
        cronExpression: '0 7 * * 1',
        enabled: false,
        nextRunAt: new Date('2026-03-17T07:00:00')
      }
    ]
  })

  console.log('Created agent schedules:', schedules.count)

  // Create audit logs
  await prisma.agentAuditLog.createMany({
    data: [
      {
        userId: user.id,
        agentName: 'content-generator',
        actionType: 'generate_posts',
        platformName: 'threads',
        contentSummary: 'Generated 2 posts',
        status: 'SUCCESS'
      },
      {
        userId: user.id,
        agentName: 'engagement-manager',
        actionType: 'check_comments',
        platformName: 'threads',
        contentSummary: 'Checked 1 post, 3 comments',
        status: 'SUCCESS'
      }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('\nTest user:', user.email)
  console.log('Platforms:', 3)
  console.log('Drafts:', 2)
  console.log('Agent schedules:', 4)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })