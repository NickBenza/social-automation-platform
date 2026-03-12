#!/usr/bin/env node
/**
 * Post to Threads using current token
 */

const fs = require('fs');
const path = require('path');

// Read token from config
const configPath = 'C:\\Users\\Owner\\.openclaw\\workspace\\config\\threads_api.env';
const config = fs.readFileSync(configPath, 'utf8');
const tokenMatch = config.match(/ACCESS_TOKEN=(.+)/);

if (!tokenMatch) {
  console.error("❌ No ACCESS_TOKEN found in config");
  process.exit(1);
}

const ACCESS_TOKEN = tokenMatch[1].trim();

// Fun test post
const postContent = `automation test from my new platform!!! 🧵

just built a full social media automation system with AI agents that:
• generate content in my voice
• monitor comments and draft replies  
• scan trends and suggest angles
• post on schedule

if you're seeing this, it worked!!!

took about 4 hours to build end-to-end. not bad.`;

async function postToThreads() {
  console.log("🧵 Posting to Threads...\n");
  console.log("Content:");
  console.log(postContent);
  console.log("\n" + "=".repeat(50) + "\n");

  try {
    // Step 1: Create container
    console.log("Step 1: Creating post container...");
    const createResponse = await fetch("https://graph.threads.net/v1.0/me/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        media_type: "TEXT",
        text: postContent,
      }),
    });

    const creationData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error("❌ Failed to create container:", creationData);
      
      if (creationData.error?.code === 190) {
        console.error("\n🔑 Token issue. Need to re-authorize.");
        console.error("Run: node scripts/generate-oauth-url.js");
      }
      process.exit(1);
    }

    console.log("✅ Container created:", creationData.id);

    // Step 2: Publish
    console.log("\nStep 2: Publishing post...");
    const publishResponse = await fetch("https://graph.threads.net/v1.0/me/threads_publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        creation_id: creationData.id,
      }),
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      console.error("❌ Failed to publish:", publishData);
      process.exit(1);
    }

    console.log("\n🎉 POSTED SUCCESSFULLY!");
    console.log("\nPost ID:", publishData.id);
    console.log("Username:", publishData.username);
    console.log("\n🔗 View on Threads:");
    console.log(`https://threads.net/@${publishData.username}/post/${publishData.id}`);
    
    // Save post info
    const postInfo = {
      id: publishData.id,
      username: publishData.username,
      content: postContent,
      postedAt: new Date().toISOString(),
      permalink: `https://threads.net/@${publishData.username}/post/${publishData.id}`
    };
    fs.writeFileSync('last_post.json', JSON.stringify(postInfo, null, 2));
    
    console.log("\n💾 Post info saved to last_post.json");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

postToThreads();
