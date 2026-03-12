#!/usr/bin/env node
/**
 * Exchange OAuth code for access token
 * Usage: node exchange-code.js <code>
 */

const APP_ID = "821897920939467";
const APP_SECRET = "aCYn0qlbbQA7D5BSTLIrorTjgOo";
const REDIRECT_URI = "https://localhost:3000/auth/callback/threads";

const code = process.argv[2];

if (!code) {
  console.error("❌ Usage: node exchange-code.js <code>");
  console.error("   Get the code from the OAuth redirect URL after authorization");
  process.exit(1);
}

async function exchangeCode() {
  console.log("🔄 Exchanging code for access token...\n");
  
  try {
    const response = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code: code,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Exchange failed:", data);
      process.exit(1);
    }
    
    console.log("✅ SUCCESS! Token obtained:\n");
    console.log("Access Token:", data.access_token);
    
    if (data.refresh_token) {
      console.log("Refresh Token:", data.refresh_token);
    }
    
    // Save to config file
    const fs = require('fs');
    const configPath = 'C:\\Users\\Owner\\.openclaw\\workspace\\config\\threads_api.env';
    
    let config = fs.readFileSync(configPath, 'utf8');
    config = config.replace(/ACCESS_TOKEN=.*/, `ACCESS_TOKEN=${data.access_token}`);
    fs.writeFileSync(configPath, config);
    
    console.log("\n💾 Token saved to config/threads_api.env");
    console.log("\n🎉 Ready to post! Run: node post-to-threads.js");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

exchangeCode();
