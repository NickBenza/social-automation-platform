#!/usr/bin/env node
/**
 * Try using app access token for API calls
 */

const APP_ID = "821897920939467";
const APP_SECRET = "aCYn0qlbbQA7D5BSTLIrorTjgOo";

const APP_ACCESS_TOKEN = `${APP_ID}|${APP_SECRET}`;

async function testAppToken() {
  console.log("🔑 Testing App Access Token...\n");
  console.log("Token:", APP_ACCESS_TOKEN.substring(0, 20) + "...");
  console.log("");
  
  // Test 1: Get app info
  console.log("Test 1: Getting app info...");
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${APP_ID}?access_token=${APP_ACCESS_TOKEN}`
    );
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
  
  // Test 2: Get test users
  console.log("\nTest 2: Getting test users...");
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${APP_ID}/accounts/test-users?access_token=${APP_ACCESS_TOKEN}`
    );
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length > 0) {
      console.log("\n✅ Found test users! Can use their tokens.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAppToken();
