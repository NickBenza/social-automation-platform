import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// LinkedIn OAuth configuration
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

/**
 * GET /api/auth/linkedin/connect
 * Initiates OAuth flow for LinkedIn
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "LinkedIn app not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI" },
        { status: 500 }
      );
    }
    
    // Build OAuth URL
    const authUrl = new URL(LINKEDIN_AUTH_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "openid profile w_member_social");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", userId);
    
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("LinkedIn connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/linkedin/callback
 * Handles OAuth callback from LinkedIn
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
    
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "LinkedIn app not configured" },
        { status: 500 }
      );
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("LinkedIn token exchange failed:", error);
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: 400 }
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user info from LinkedIn API
    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
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
        platformName: "linkedin",
      },
    });
    
    if (existing) {
      await prisma.connectedplatform.update({
        where: { id: existing.id },
        data: {
          platformUserId: userData.sub,
          platformUsername: userData.name,
          oauthToken: tokenData.access_token,
          oauthRefreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.connectedplatform.create({
        data: {
          userId,
          platformName: "linkedin",
          platformUserId: userData.sub,
          platformUsername: userData.name,
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
      username: userData.name,
      platform: "linkedin",
    });
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.json(
      { error: "Failed to complete connection" },
      { status: 500 }
    );
  }
}