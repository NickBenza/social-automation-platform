#!/usr/bin/env node
/**
 * Explore the Agent Central Command server
 */

const { loadDiscordToken } = require('./discord-config');
const TOKEN = loadDiscordToken();
const GUILD_ID = "1481450381157601322";

async function exploreServer() {
  console.log("🔍 Exploring Agent Central Command...\n");
  
  try {
    // Get guild details
    const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}`, {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (!guildResponse.ok) {
      console.error("❌ Can't access server:", await guildResponse.json());
      return;
    }
    
    const guild = await guildResponse.json();
    console.log("📋 Server Info:");
    console.log("  Name:", guild.name);
    console.log("  ID:", guild.id);
    console.log("  Owner ID:", guild.owner_id);
    console.log("  Members:", guild.approximate_member_count || "Unknown");
    console.log("  Icon:", guild.icon ? "Yes" : "No");
    console.log("  Description:", guild.description || "None");
    
    // Get channels
    console.log("\n📢 Channels:");
    const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (channelsResponse.ok) {
      const channels = await channelsResponse.json();
      
      // Group by type
      const textChannels = channels.filter(c => c.type === 0);
      const voiceChannels = channels.filter(c => c.type === 2);
      const categories = channels.filter(c => c.type === 4);
      
      console.log("\n  Text Channels:");
      for (const ch of textChannels) {
        console.log(`    #${ch.name} (${ch.id})`);
      }
      
      console.log("\n  Voice Channels:");
      for (const ch of voiceChannels) {
        console.log(`    🔊 ${ch.name} (${ch.id})`);
      }
      
      console.log("\n  Categories:");
      for (const cat of categories) {
        console.log(`    📁 ${cat.name}`);
      }
    }
    
    // Get my roles/permissions in this server
    const memberResponse = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/@me`, {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (memberResponse.ok) {
      const member = await memberResponse.json();
      console.log("\n👤 My Roles:", member.roles.length > 0 ? member.roles.join(", ") : "None");
    }
    
    console.log("\n✅ Successfully connected to Agent Central Command!");
    console.log("   Ready to interact with channels and members.");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

exploreServer();
