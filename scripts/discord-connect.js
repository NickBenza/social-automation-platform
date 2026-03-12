#!/usr/bin/env node
/**
 * Connect to Discord and check bot status
 */

const { loadDiscordToken } = require('./discord-config');
const TOKEN = loadDiscordToken();

async function getBotInfo() {
  console.log("🤖 Connecting to Discord...\n");
  
  try {
    // Get bot user info
    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (!userResponse.ok) {
      const error = await userResponse.json();
      console.error("❌ Failed to connect:", error);
      return;
    }
    
    const user = await userResponse.json();
    console.log("✅ Connected!");
    console.log("\nBot Info:");
    console.log("  Name:", user.username);
    console.log("  ID:", user.id);
    console.log("  Avatar:", user.avatar ? "Yes" : "No");
    
    // Get guilds (servers) the bot is in
    const guildsResponse = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (guildsResponse.ok) {
      const guilds = await guildsResponse.json();
      console.log("\n📋 Servers I'm in:", guilds.length);
      
      for (const guild of guilds) {
        console.log(`  • ${guild.name} (${guild.id})`);
        
        // Check if this is Agent Central Command
        if (guild.name.toLowerCase().includes("agent") || guild.name.toLowerCase().includes("central")) {
          console.log("    👆 This might be Agent Central Command!");
        }
      }
      
      if (guilds.length === 0) {
        console.log("\n⚠️  Not in any servers yet.");
        console.log("Need an invite link to join Agent Central Command.");
      }
    }
    
    // Get bot's gateway info
    const gatewayResponse = await fetch("https://discord.com/api/v10/gateway/bot", {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (gatewayResponse.ok) {
      const gateway = await gatewayResponse.json();
      console.log("\n🔗 Gateway Info:");
      console.log("  URL:", gateway.url);
      console.log("  Shards:", gateway.shards);
      console.log("  Session Start Limit:", gateway.session_start_limit?.remaining, "/", gateway.session_start_limit?.total);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Also try to accept an invite if provided
async function tryJoinServer(inviteCode) {
  if (!inviteCode) return;
  
  console.log(`\n📨 Trying to join server with invite: ${inviteCode}...`);
  
  try {
    const response = await fetch(`https://discord.com/api/v10/invites/${inviteCode}`, {
      method: "POST",
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Joined server:", data.guild?.name);
    } else {
      console.log("❌ Could not join:", data.message || data);
    }
  } catch (error) {
    console.error("❌ Error joining:", error.message);
  }
}

getBotInfo().then(() => {
  // If you have an invite code, uncomment and run:
  // tryJoinServer("INVITE_CODE_HERE");
});
