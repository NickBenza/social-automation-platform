#!/usr/bin/env node
/**
 * Join Discord server via invite
 */

const { loadDiscordToken } = require('./discord-config');
const TOKEN = loadDiscordToken();
const INVITE_CODE = "SABz2gTEe";

async function joinServer() {
  console.log("📨 Joining server with invite...\n");
  
  try {
    // First, get invite info
    console.log("Step 1: Getting invite info...");
    const inviteResponse = await fetch(`https://discord.com/api/v10/invites/${INVITE_CODE}`, {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    
    if (!inviteResponse.ok) {
      const error = await inviteResponse.json();
      console.error("❌ Invalid invite:", error);
      return;
    }
    
    const invite = await inviteResponse.json();
    console.log("✅ Invite valid!");
    console.log("  Server:", invite.guild?.name);
    console.log("  Channel:", invite.channel?.name);
    console.log("  Members:", invite.approximate_member_count || "Unknown");
    
    // Try to accept invite
    console.log("\nStep 2: Accepting invite...");
    const joinResponse = await fetch(`https://discord.com/api/v10/invites/${INVITE_CODE}`, {
      method: "POST",
      headers: { 
        Authorization: `Bot ${TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    
    const joinData = await joinResponse.json();
    
    if (joinResponse.ok) {
      console.log("✅ JOINED SUCCESSFULLY!");
      console.log("\nServer Info:");
      console.log("  Name:", joinData.guild?.name);
      console.log("  ID:", joinData.guild?.id);
      console.log("  Channel:", joinData.channel?.name);
      
      // Save server info
      const fs = require('fs');
      fs.writeFileSync('joined_server.json', JSON.stringify({
        joinedAt: new Date().toISOString(),
        server: joinData.guild,
        channel: joinData.channel
      }, null, 2));
      
      console.log("\n💾 Server info saved to joined_server.json");
      
    } else {
      console.error("❌ Could not join:", joinData);
      
      if (joinData.code === 50001) {
        console.log("\n⚠️  Bot lacks permissions or invite expired.");
        console.log("   You may need to manually invite the bot.");
      }
      if (joinData.retry_after) {
        console.log(`\n⏳ Rate limited. Try again in ${joinData.retry_after} seconds.`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

joinServer();
