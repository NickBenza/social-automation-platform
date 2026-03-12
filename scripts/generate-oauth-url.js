#!/usr/bin/env node
/**
 * Generate OAuth URL for manual authorization
 */

const APP_ID = "821897920939467";
const REDIRECT_URI = "https://localhost:3000/auth/callback/threads";
const SCOPES = "threads_basic,threads_content_publish";

const authUrl = `https://threads.net/oauth/authorize?` +
  `client_id=${APP_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${SCOPES}&` +
  `response_type=code&` +
  `state=test_user_123`;

console.log("🔗 OAuth Authorization URL:\n");
console.log(authUrl);
console.log("\n📋 Instructions:");
console.log("1. Visit this URL in your browser");
console.log("2. Log in to Instagram/Threads");
console.log("3. Authorize the app");
console.log("4. You'll be redirected to localhost (which won't work)");
console.log("5. Copy the 'code' parameter from the URL");
console.log("6. Run: node exchange-code.js <code>");

// Save URL to file
const fs = require('fs');
fs.writeFileSync('oauth_url.txt', authUrl);
console.log("\n💾 URL saved to oauth_url.txt");
