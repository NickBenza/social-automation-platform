import {
  SocialConnector,
  OAuthTokens,
  AuthResult,
  UserProfile,
  Post,
  PostPayload,
  PostResult,
  Comment,
  ReplyResult,
} from "./types";

export class ThreadsConnector implements SocialConnector {
  id = "threads";
  platformName = "Threads";
  
  private baseUrl = "https://graph.threads.net/v1.0";
  
  async authenticate(credentials: OAuthTokens): Promise<AuthResult> {
    try {
      // Verify token by fetching user profile
      const profile = await this.getProfile(credentials);
      
      return {
        success: true,
        tokens: credentials,
        userId: profile.id,
        username: profile.username,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }
  
  async refreshToken(tokens: OAuthTokens): Promise<OAuthTokens> {
    // Meta tokens are long-lived (60 days), but can be refreshed
    const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.THREADS_APP_ID || "",
        client_secret: process.env.THREADS_APP_SECRET || "",
        fb_exchange_token: tokens.accessToken,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }
  
  async revokeAccess(tokens: OAuthTokens): Promise<void> {
    await fetch(`${this.baseUrl}/me/permissions`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
  }
  
  async getProfile(tokens: OAuthTokens): Promise<UserProfile> {
    const response = await fetch(
      `${this.baseUrl}/me?fields=id,username,threads_profile_picture_url&access_token=${tokens.accessToken}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      username: data.username,
      avatarUrl: data.threads_profile_picture_url,
    };
  }
  
  async getFollowerCount(tokens: OAuthTokens): Promise<number> {
    // Note: Threads API doesn't expose follower count directly yet
    // This would require the Instagram Graph API connection
    return 0;
  }
  
  async getRecentPosts(tokens: OAuthTokens, limit: number = 25): Promise<Post[]> {
    const response = await fetch(
      `${this.baseUrl}/me/threads?fields=id,media_product_type,text,timestamp,permalink&limit=${limit}&access_token=${tokens.accessToken}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.data.map((thread: any) => ({
      id: thread.id,
      platformId: thread.id,
      content: thread.text || "",
      createdAt: new Date(thread.timestamp),
      // Note: Threads API doesn't expose engagement metrics directly
      likes: 0,
      comments: 0,
      shares: 0,
    }));
  }
  
  async createPost(tokens: OAuthTokens, content: PostPayload): Promise<PostResult> {
    try {
      // Step 1: Create a single post container
      const createResponse = await fetch(`${this.baseUrl}/me/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          media_type: "TEXT",
          text: content.content,
        }),
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error?.message || "Failed to create post");
      }
      
      const creationData = await createResponse.json();
      const containerId = creationData.id;
      
      // Step 2: Publish the container
      const publishResponse = await fetch(`${this.baseUrl}/me/threads_publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          creation_id: containerId,
        }),
      });
      
      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.error?.message || "Failed to publish post");
      }
      
      const publishData = await publishResponse.json();
      
      return {
        success: true,
        postId: publishData.id,
        postUrl: `https://threads.net/@${publishData.username}/post/${publishData.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  
  async getComments(tokens: OAuthTokens, postId: string): Promise<Comment[]> {
    // Note: Threads API for comments is limited
    // This would need Instagram Graph API for full comment access
    return [];
  }
  
  async replyToComment(tokens: OAuthTokens, commentId: string, content: string): Promise<ReplyResult> {
    // Note: Reply functionality requires Instagram Graph API
    return {
      success: false,
      error: "Reply not yet supported via Threads API",
    };
  }
}