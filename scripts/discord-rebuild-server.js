#!/usr/bin/env node
/**
 * Create organized channel structure for Agent Central Command
 */

const { loadDiscordToken } = require('./discord-config');
const TOKEN = loadDiscordToken();
const GUILD_ID = "1481450381157601322";

// Channel structure to create
const CATEGORIES = [
  {
    name: "📋 INFORMATION",
    channels: [
      { name: "welcome", type: 0, topic: "Welcome to Agent Central Command! Rules and info here." },
      { name: "announcements", type: 0, topic: "Important updates and announcements" },
    ]
  },
  {
    name: "🤖 AI AUTOMATION",
    channels: [
      { name: "social-automation-platform", type: 0, topic: "Social Media Automation Platform built with Claude Code - Next.js, SQLite, 4 AI Agents" },
      { name: "ai-hiring-radar", type: 0, topic: "AI company job tracking and LinkedIn content automation" },
      { name: "agent-logs", type: 0, topic: "Automated logs from AI agents" },
      { name: "content-queue", type: 0, topic: "Draft posts and content approval" },
    ]
  },
  {
    name: "💬 GENERAL",
    channels: [
      { name: "general-chat", type: 0, topic: "General discussion" },
      { name: "random", type: 0, topic: "Random stuff, memes, off-topic" },
      { name: "showcase", type: 0, topic: "Show off your projects and builds" },
    ]
  },
  {
    name: "🎙️ VOICE CHANNELS",
    channels: [
      { name: "General Voice", type: 2 },
      { name: "Meeting Room 1", type: 2 },
      { name: "Meeting Room 2", type: 2 },
      { name: "Pair Programming", type: 2 },
    ]
  },
  {
    name: "🔧 RESOURCES",
    channels: [
      { name: "github-repos", type: 0, topic: "GitHub repositories and code sharing" },
      { name: "docs-and-guides", type: 0, topic: "Documentation, tutorials, and helpful links" },
      { name: "tools-and-software", type: 0, topic: "Software recommendations and tools" },
    ]
  }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createChannel(guildId, name, type, parentId = null, topic = null) {
  const body = {
    name: name.toLowerCase().replace(/\s+/g, '-'),
    type: type,
  };
  
  if (parentId) body.parent_id = parentId;
  if (topic) body.topic = topic;
  
  // For voice channels
  if (type === 2) {
    body.bitrate = 64000;
    body.user_limit = 0;
  }
  
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Created: #${data.name}`);
      return data;
    } else {
      const error = await response.json();
      console.log(`  ❌ Failed #${name}:`, error.message);
      return null;
    }
  } catch (error) {
    console.log(`  ❌ Error #${name}:`, error.message);
    return null;
  }
}

async function createCategory(guildId, name) {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        type: 4, // Category
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📁 Created category: ${name}`);
      return data.id;
    } else {
      const error = await response.json();
      console.log(`❌ Failed category ${name}:`, error.message);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error category ${name}:`, error.message);
    return null;
  }
}

async function deleteExistingChannels() {
  console.log("🗑️  Cleaning up existing channels...\n");
  
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (!response.ok) return;
    
    const channels = await response.json();
    
    // Delete all channels except @everyone (not applicable) and system channels
    for (const channel of channels) {
      // Keep the default general text and voice initially, we'll reorganize
      if (channel.name === 'general' && channel.type === 0) continue;
      
      const delResponse = await fetch(`https://discord.com/api/v10/channels/${channel.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bot ${TOKEN}` }
      });
      
      if (delResponse.ok) {
        console.log(`  🗑️  Deleted: #${channel.name}`);
      }
      
      await delay(500); // Rate limit protection
    }
  } catch (error) {
    console.log("❌ Error deleting channels:", error.message);
  }
}

async function buildServer() {
  console.log("🏗️  REBUILDING AGENT CENTRAL COMMAND\n");
  console.log("=====================================\n");
  
  // Optional: Clean up first (commented out for safety)
  // await deleteExistingChannels();
  // console.log("");
  
  for (const category of CATEGORIES) {
    console.log(`\n📁 Creating: ${category.name}`);
    console.log("-".repeat(40));
    
    // Create category
    const categoryId = await createCategory(GUILD_ID, category.name);
    await delay(1000);
    
    if (!categoryId) continue;
    
    // Create channels under this category
    for (const channel of category.channels) {
      await createChannel(GUILD_ID, channel.name, channel.type, categoryId, channel.topic || null);
      await delay(1000); // Rate limit protection between channel creations
    }
  }
  
  console.log("\n=====================================");
  console.log("✅ SERVER REBUILD COMPLETE!");
  console.log("\nKey channels created:");
  console.log("  • #social-automation-platform");
  console.log("  • #ai-hiring-radar");
  console.log("  • #agent-logs");
  console.log("  • #content-queue");
  console.log("  • Voice channels for meetings");
}

buildServer();
