#!/usr/bin/env node
/**
 * Send detailed info about the Social Automation Platform to Discord
 */

const { loadDiscordToken } = require('./discord-config');
const TOKEN = loadDiscordToken();
const CHANNEL_ID = "1481459572668370955"; // social-automation-platform channel

const MESSAGE = `🚀 **Social Automation Platform - Build Complete!**

Built today with Claude Code in ~4 hours:

**📊 Tech Stack:**
• Next.js 14 + TypeScript frontend
• SQLite database with Prisma ORM
• 4 AI Python agents with Ollama LLM
• OAuth integration for social platforms

**🤖 AI Agents:**
1. **Content Generator** - Creates posts in your voice
2. **Engagement Manager** - Monitors comments, drafts replies
3. **Trend Scanner** - Finds trending topics, suggests angles
4. **Analytics Reporter** - Weekly reports with insights

**📱 Platforms Supported:**
• Threads (Meta) - ✅ OAuth ready
• LinkedIn - ✅ OAuth ready
• X/Twitter - ⚠️ Requires $100/mo API

**✨ Features:**
• Voice profile learning (analyzes your content)
• Draft queue with approval workflow
• Schedule posts (DRAFT+CRON mode)
• Full automation mode option
• Real-time dashboard

**🔗 GitHub:** https://github.com/NickBenza/social-automation-platform

Status: Ready for testing! 🎉`;

async function sendMessage() {
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: MESSAGE })
    });
    
    if (response.ok) {
      console.log("✅ Platform overview posted to #social-automation-platform");
    } else {
      console.error("❌ Failed:", await response.json());
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

sendMessage();
