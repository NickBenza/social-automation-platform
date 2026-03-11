export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
}

export interface AuthResult {
  success: boolean;
  tokens?: OAuthTokens;
  userId?: string;
  username?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  bio?: string;
}

export interface Post {
  id: string;
  platformId: string;
  content: string;
  mediaUrls?: string[];
  createdAt: Date;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  hashtags?: string[];
  mentions?: string[];
}

export interface PostPayload {
  content: string;
  mediaUrls?: string[];
  replyToId?: string;
  scheduledTime?: Date;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: Date;
  likes?: number;
  replies?: number;
  isReply?: boolean;
  parentCommentId?: string;
}

export interface ReplyResult {
  success: boolean;
  replyId?: string;
  error?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsData {
  impressions?: number;
  engagements?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  profileViews?: number;
  followerChange?: number;
  posts?: PostAnalytics[];
}

export interface PostAnalytics {
  postId: string;
  impressions: number;
  engagements: number;
  engagementRate: number;
}

export interface SocialConnector {
  id: string;
  platformName: string;
  
  authenticate(credentials: OAuthTokens): Promise<AuthResult>;
  refreshToken?(tokens: OAuthTokens): Promise<OAuthTokens>;
  revokeAccess(tokens: OAuthTokens): Promise<void>;
  
  getProfile(tokens: OAuthTokens): Promise<UserProfile>;
  getFollowerCount(tokens: OAuthTokens): Promise<number>;
  
  getRecentPosts(tokens: OAuthTokens, limit: number): Promise<Post[]>;
  getPost?(tokens: OAuthTokens, postId: string): Promise<Post>;
  createPost(tokens: OAuthTokens, content: PostPayload): Promise<PostResult>;
  deletePost?(tokens: OAuthTokens, postId: string): Promise<boolean>;
  
  getComments(tokens: OAuthTokens, postId: string): Promise<Comment[]>;
  replyToComment(tokens: OAuthTokens, commentId: string, content: string): Promise<ReplyResult>;
  
  getAnalytics?(tokens: OAuthTokens, dateRange: DateRange): Promise<AnalyticsData>;
}