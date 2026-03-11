#!/usr/bin/env node
/**
 * Test script for API connections
 * Usage: node scripts/test-connections.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnections() {
  console.log("🔍 Testing Social Media API Connections\n");
  
  // Get connected platforms
  const platforms = await prisma.connectedplatform.findMany();
  
  if (platforms.length === 0) {
    console.log("❌ No platforms connected yet.");
    console.log("   Run the app and connect platforms from the dashboard.");
    process.exit(0);
  }
  
  console.log(`Found ${platforms.length} connected platform(s):\n`);
  
  for (const platform of platforms) {
    console.log(`📱 ${platform.platformName.toUpperCase()}`);
    console.log(`   Username: ${platform.platformUsername || 'N/A'}`);
    console.log(`   Mode: ${platform.mode}`);
    console.log(`   Followers: ${platform.followerCount || 0}`);
    
    // Check token status
    const tokenExpired = platform.tokenExpiresAt && new Date() > platform.tokenExpiresAt;
    console.log(`   Token: ${tokenExpired ? '❌ EXPIRED' : '✅ Valid'}`);
    
    if (platform.tokenExpiresAt) {
      const daysUntilExpiry = Math.floor((platform.tokenExpiresAt - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`   Expires in: ${daysUntilExpiry} days`);
    }
    
    console.log('');
  }
  
  // Check environment variables
  console.log("🔧 Environment Variables:\n");
  
  const requiredVars = {
    'THREADS_APP_ID': process.env.THREADS_APP_ID,
    'THREADS_APP_SECRET': process.env.THREADS_APP_SECRET ? '***' : undefined,
    'LINKEDIN_CLIENT_ID': process.env.LINKEDIN_CLIENT_ID,
    'LINKEDIN_CLIENT_SECRET': process.env.LINKEDIN_CLIENT_SECRET ? '***' : undefined,
  };
  
  for (const [key, value] of Object.entries(requiredVars)) {
    console.log(`   ${value ? '✅' : '❌'} ${key}`);
  }
  
  console.log('\n✨ Done!');
}

testConnections()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
