#!/usr/bin/env node
/**
 * Try device authorization flow (no browser needed)
 */

const APP_ID = "821897920939467";

async function deviceAuth() {
  console.log("📱 Trying Device Authorization Flow...\n");
  
  try {
    // Step 1: Request device code
    const response = await fetch("https://graph.facebook.com/v18.0/device/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        access_token: `${APP_ID}|${APP_ID}`,
        scope: "threads_basic,threads_content_publish",
      }),
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.code && data.verification_uri) {
      console.log("\n✅ Device code obtained!");
      console.log("\n📱 Visit this URL on your phone:");
      console.log(data.verification_uri);
      console.log("\n🔑 Enter this code:", data.user_code);
      console.log("\n⏳ Polling for authorization...");
      
      // Poll for token
      pollForToken(data.code, data.interval || 5);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function pollForToken(deviceCode, interval) {
  const APP_SECRET = "aCYn0qlbbQA7D5BSTLIrorTjgOo";
  
  const check = async () => {
    try {
      const response = await fetch("https://graph.facebook.com/v18.0/device/login_status", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          access_token: `${APP_ID}|${APP_SECRET}`,
          code: deviceCode,
        }),
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        console.log("\n🎉 AUTHORIZED!");
        console.log("Token:", data.access_token);
        return;
      }
      
      if (data.error) {
        console.log("Status:", data.error.message);
      }
      
      // Continue polling
      setTimeout(check, interval * 1000);
    } catch (error) {
      console.error("Poll error:", error.message);
    }
  };
  
  check();
}

deviceAuth();
