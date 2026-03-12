#!/usr/bin/env node
/**
 * Check token permissions
 */

const ACCESS_TOKEN = "EAALrgwWehcsBQzIQUK9mtu2dgPejeIXpoTBK6W04wJNQDHdQZB8aZB6WodOfs5miNPoxSJc3sJWLbLWEznZBGHZBz2AZBtJixSVZCOwyL62cFoZCFHWpkZAJzXMARQcmxsZCNIdQEAZCmik0s87IwIDL2d6NRTjVNJmbgMErxbt43Hvx57CK0iPETj8NAJZBZCYXiAZDZD";

async function checkToken() {
  console.log("🔍 Checking Token Permissions\n");

  const response = await fetch(`https://graph.facebook.com/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`);
  const data = await response.json();

  if (data.data) {
    console.log("✅ Token is VALID");
    console.log("App:", data.data.application);
    console.log("User ID:", data.data.user_id);
    console.log("Expires:", new Date(data.data.expires_at * 1000).toLocaleString());
    console.log("\n❌ PROBLEM: Scopes/Permissions:", data.data.scopes);
    console.log("   The token has NO permissions!");
    console.log("\n🔧 To post to Threads, you need these permissions:");
    console.log("   - threads_basic");
    console.log("   - threads_content_publish");
    console.log("\n💡 Solution: Re-authorize the app with posting permissions.");
    console.log("   Go to: https://developers.facebook.com/tools/explorer/");
    console.log("   Select your app, then request these permissions:");
    console.log("   threads_basic, threads_content_publish");
  }
}

checkToken();
