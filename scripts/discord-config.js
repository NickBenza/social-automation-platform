// Load Discord bot token from environment file
const fs = require('fs');
const path = require('path');

function loadDiscordToken() {
  // Try environment variable first
  if (process.env.DISCORD_BOT_TOKEN) {
    return process.env.DISCORD_BOT_TOKEN;
  }
  
  // Try loading from config file
  const configPath = 'C:\\Users\\Owner\\.openclaw\\workspace\\config\\discord.env';
  try {
    const config = fs.readFileSync(configPath, 'utf8');
    const match = config.match(/DISCORD_BOT_TOKEN=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    // Config file doesn't exist
  }
  
  throw new Error('DISCORD_BOT_TOKEN not found. Set environment variable or create config/discord.env');
}

module.exports = { loadDiscordToken };
