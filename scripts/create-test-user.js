#!/usr/bin/env node
/**
 * Create a test user and get their access token
 */

const APP_ID = "821897920939467";
const APP_SECRET = "aCYn0qlbbQA7D5BSTLIrorTjgOo";
const APP_ACCESS_TOKEN = `${APP_ID}|${APP_SECRET}`;

async function createTestUser() {
  console.log("👤 Creating test user...\n");
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${APP_ID}/accounts/test-users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          access_token: APP_ACCESS_TOKEN,
          installed: "true",
          permissions: "threads_basic,threads_content_publish",
          name: "Test User",
        }),
      }
    );
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.access_token) {
      console.log("\n✅ Test user created!");
      console.log("Email:", data.email);
      console.log("Password:", data.password);
      console.log("Access Token:", data.access_token);
      
      // Save token
      const fs = require('fs');
      const configPath = 'C:\\Users\\Owner\\.openclaw\\workspace\\config\\threads_api.env';
      let config = fs.readFileSync(configPath, 'utf8');
      config = config.replace(/ACCESS_TOKEN=.*/, `ACCESS_TOKEN=${data.access_token}`);
      fs.writeFileSync(configPath, config);
      
      console.log("\n💾 Token saved! Ready to post.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createTestUser();
