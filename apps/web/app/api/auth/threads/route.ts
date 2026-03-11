import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@social-platform/database";

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

// Threads OAuth configuration
const THREADS_AUTH_URL = "https://threads.net/oauth/authorize";
const THREADS_TOKEN_URL = "https://graph.threads.net/oauth/access_token";

/**
 * GET /api/auth/threads/connect
 * Initiates OAuth flow for Threads
 */
export async function GET(request: NextRequest) {
  console.log("[API] Threads GET called with URL:", request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    console.log("[API] userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    
    const appId = process.env.THREADS_APP_ID;
    const redirectUri = process.env.THREADS_REDIRECT_URI;
    
    if (!appId || !redirectUri) {
      console.error("Threads not configured - missing THREADS_APP_ID or THREADS_REDIRECT_URI");
      return NextResponse.json(
        { 
          error: "Threads app not configured",
          details: "The platform owner needs to set THREADS_APP_ID and THREADS_REDIRECT_URI environment variables",
          setupGuide: "https://github.com/NickBenza/social-automation-platform/blob/main/docs/API_SETUP.md"
        },
        { status: 500 }
      );
    }
    
    // Build OAuth URL
    const authUrl = new URL(THREADS_AUTH_URL);
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "threads_basic,threads_content_publish");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", userId); // Use state to track user
    
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("Threads connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/threads/callback
 * Handles OAuth callback from Threads
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state: userId } = body;
    
    if (!code || !userId) {
      return NextResponse.json(
        { error: "code and userId required" },
        { status: 400 }
      );
    }
    
    const appId = process.env.THREADS_APP_ID;
    const appSecret = process.env.THREADS_APP_SECRET;
    const redirectUri = process.env.THREADS_REDIRECT_URI;
    
    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Threads app not configured" },
        { status: 500 }
      );
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch(THREADS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: 400 }
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user info from token
    const userResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${tokenData.access_token}`
    );
    
    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user info" },
        { status: 400 }
      );
    }
    
    const userData = await userResponse.json();
    
    // Save to database
    const existing = await prisma.connectedplatform.findFirst({
      where: {
        userId,
        platformName: "threads",
      },
    });
    
    if (existing) {
      // Update existing
      await prisma.connectedplatform.update({
        where: { id: existing.id },
        data: {
          platformUserId: userData.id,
          platformUsername: userData.username,
          oauthToken: tokenData.access_token,
          oauthRefreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      await prisma.connectedplatform.create({
        data: {
          userId,
          platformName: "threads",
          platformUserId: userData.id,
          platformUsername: userData.username,
          oauthToken: tokenData.access_token,
          oauthRefreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          mode: "DRAFT_CRON",
          config: JSON.stringify({}),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      username: userData.username,
      platform: "threads",
    });
  } catch (error) {
    console.error("Threads callback error:", error);
    return NextResponse.json(
      { error: "Failed to complete connection" },
      { status: 500 }
    );
  }
}