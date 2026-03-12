#!/usr/bin/env node
/**
 * Debug Threads API token
 */

const ACCESS_TOKEN = "EAALrgwWehcsBQzIQUK9mtu2dgPejeIXpoTBK6W04wJNQDHdQZB8aZB6WodOfs5miNPoxSJc3sJWLbLWEznZBGHZBz2AZBtJixSVZCOwyL62cFoZCFHWpkZAJzXMARQcmxsZCNIdQEAZCmik0s87IwIDL2d6NRTjVNJmbgMErxbt43Hvx57CK0iPETj8NAJZBZCYXiAZDZD";

async function debugToken() {
  console.log("🔍 Debugging Threads Token\n");
  console.log("Token length:", ACCESS_TOKEN.length);
  console.log("Token starts with:", ACCESS_TOKEN.substring(0, 10) + "...");
  console.log("");

  // Test 1: Get user info
  console.log("Test 1: Getting user info...");
  try {
    const response = await fetch(`https://graph.threads.net/v1.0/me?access_token=${ACCESS_TOKEN}`);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log("\nTest 2: Check token debug endpoint...");
  try {
    const response = await fetch(`https://graph.facebook.com/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`);
    const data = await response.json();
    console.log("Token debug:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

debugToken();
