#!/usr/bin/env node
/**
 * List all channels with their IDs
 */

const { loadDiscordToken } = require('./discord-config');
const TOKEN = loadDiscordToken();
const GUILD_ID = "1481450381157601322";

async function listChannels() {
  const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
    headers: { Authorization: `Bot ${TOKEN}` }
  });
  
  if (response.ok) {
    const channels = await response.json();
    
    // Sort by position
    channels.sort((a, b) => a.position - b.position);
    
    console.log("📋 ALL CHANNELS:\n");
    
    for (const ch of channels) {
      const type = ch.type === 4 ? '📁 CAT' : ch.type === 0 ? '#️⃣ TXT' : ch.type === 2 ? '🔊 VOX' : '❓';
      console.log(`${type} ${ch.name.padEnd(30)} | ID: ${ch.id}`);
    }
  }
}

listChannels();
