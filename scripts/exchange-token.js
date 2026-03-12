#!/usr/bin/env node
/**
 * Exchange short-lived token for long-lived token with permissions
 */

const APP_ID = "821897920939467";
const APP_SECRET = "aCYn0qlbbQA7D5BSTLIrorTjgOo";
const SHORT_LIVED_TOKEN = "EAALrgwWehcsBQzIQUK9mtu2dgPejeIXpoTBK6W04wJNQDHdQZB8aZB6WodOfs5miNPoxSJc3sJWLbLWEznZBGHZBz2AZBtJixSVZCOwyL62cFoZCFHWpkZAJzXMARQcmxsZCNIdQEAZCmik0s87IwIDL2d6NRTjVNJmbgMErxbt43Hvx57CK0iPETj8NAJZBZCYXiAZDZD";

async function exchangeToken() {
  console.log("🔄 Exchanging for long-lived token...\n");
  
  try {
    // Exchange short-lived for long-lived
    const response = await fetch(
      `https://graph.threads.net/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${APP_ID}&` +
      `client_secret=${APP_SECRET}&` +
      `fb_exchange_token=${SHORT_LIVED_TOKEN}`,
      { method: "GET" }
    );
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.access_token) {
      console.log("\n✅ New long-lived token obtained!");
      console.log("Token:", data.access_token);
      
      // Save to file
      const fs = require('fs');
      fs.writeFileSync('new_token.txt', data.access_token);
      console.log("\n💾 Token saved to new_token.txt");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

exchangeToken();
