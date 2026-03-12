#!/usr/bin/env node
/**
 * List all test users and get their tokens
 */

const APP_ID = "821897920939467";
const APP_SECRET = "aCYn0qlbbQA7D5BSTLIrorTjgOo";
const APP_ACCESS_TOKEN = `${APP_ID}|${APP_SECRET}`;

async function listTestUsers() {
  console.log("📋 Listing test users...\n");
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${APP_ID}/accounts/test-users?access_token=${APP_ACCESS_TOKEN}&limit=100`
    );
    
    const data = await response.json();
    console.log("Found", data.data?.length || 0, "test users\n");
    
    if (data.data && data.data.length > 0) {
      for (const user of data.data) {
        console.log("User ID:", user.id);
        console.log("Login URL:", user.login_url);
        
        // Get fresh token for this user
        const tokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/${user.id}?access_token=${APP_ACCESS_TOKEN}&fields=access_token`
        );
        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
          console.log("Access Token:", tokenData.access_token);
          
          // Save first valid token
          const fs = require('fs');
          const configPath = 'C:\\Users\\Owner\\.openclaw\\workspace\\config\\threads_api.env';
          let config = fs.readFileSync(configPath, 'utf8');
          config = config.replace(/ACCESS_TOKEN=.*/, `ACCESS_TOKEN=${tokenData.access_token}`);
          fs.writeFileSync(configPath, config);
          console.log("💾 Token saved!");
          break;
        }
        console.log("");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listTestUsers();
