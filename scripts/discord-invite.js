#!/usr/bin/env node
/**
 * Generate OAuth invite URL for the bot
 */

const CLIENT_ID = "1481456908870226113";

// Permissions needed
const PERMISSIONS = "2147483647"; // Admin permissions (all)

// Generate invite URL
const inviteUrl = `https://discord.com/api/oauth2/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `permissions=${PERMISSIONS}&` +
  `scope=bot`;

console.log("🔗 BOT INVITE URL:");
console.log("==================\n");
console.log(inviteUrl);
console.log("\n==================\n");
console.log("📋 Instructions:");
console.log("1. Click the URL above");
console.log("2. Select 'Agent Central Command' server");
console.log("3. Click 'Authorize'");
console.log("4. Complete CAPTCHA if needed");
console.log("5. Bot will join automatically!");
console.log("\n✅ Once joined, I can see channels and send messages!");

// Save to file
const fs = require('fs');
fs.writeFileSync('discord_invite_url.txt', inviteUrl);
console.log("\n💾 URL saved to discord_invite_url.txt");

// Also generate for specific server
console.log("\n🎯 Or use this direct link for Agent Central Command:");
const directUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=${PERMISSIONS}&scope=bot&guild_id=SERVER_ID`;
console.log("(Need server ID for direct link)");
