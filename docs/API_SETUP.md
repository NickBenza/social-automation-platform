# Social Media API Setup Guide

This guide walks you through connecting your social media accounts to the automation platform.

## Prerequisites

- Node.js 18+ installed
- The web app running locally (`npm run dev` in `apps/web`)
- Accounts on the platforms you want to connect

## Platform Setup

### 1. Threads (Meta)

**Step 1: Create a Meta App**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Select "Other" → "Business"
4. App name: "Social Automation Platform"
5. Add "Threads API" product to your app

**Step 2: Configure App**
1. In App Dashboard → Settings → Basic
2. Note your **App ID** and **App Secret**
3. Add your domain to "App Domains" (e.g., `localhost` for local dev)

**Step 3: Set Redirect URI**
1. Go to Products → Threads API → Settings
2. Add redirect URI: `http://localhost:3000/auth/callback/threads`

**Step 4: Add to .env**
```
THREADS_APP_ID=your_app_id
THREADS_APP_SECRET=your_app_secret
THREADS_REDIRECT_URI=http://localhost:3000/auth/callback/threads
```

**Step 5: Connect Account**
1. Go to dashboard → Platforms → Connect Threads
2. Follow OAuth flow
3. Grant permissions for posting

**Limitations:**
- Threads API only supports text posts (no images yet via API)
- Requires business verification for production use

---

### 2. LinkedIn

**Step 1: Create LinkedIn App**
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Click "Create App"
3. Fill in app details
4. Add your logo and privacy policy URL

**Step 2: Get Credentials**
1. In your app dashboard, note:
   - **Client ID**
   - **Client Secret**
2. Add OAuth 2.0 redirect URLs:
   - `http://localhost:3000/auth/callback/linkedin`

**Step 3: Request Access**
1. Apply for "Sign In with LinkedIn" and "Share on LinkedIn" products
2. Wait for approval (usually instant for dev, longer for prod)

**Step 4: Add to .env**
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/callback/linkedin
```

**Step 5: Connect Account**
1. Go to dashboard → Platforms → Connect LinkedIn
2. Follow OAuth flow
3. Grant posting permissions

**Limitations:**
- Rate limits: 500 posts/day for most users
- Requires approval for w_member_social scope

---

### 3. X (Twitter) - OPTIONAL

**⚠️ WARNING: X API costs $100/month minimum**

Due to cost, X is disabled by default. To enable:

**Step 1: Get API Access**
1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Subscribe to Basic tier ($100/month)
3. Create a project and app

**Step 2: Generate Keys**
1. In Keys and Tokens section:
   - API Key
   - API Secret
   - Bearer Token
2. Generate Access Token & Secret for your account

**Step 3: Add to .env**
```
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
X_BEARER_TOKEN=your_bearer_token
```

---

### 4. Instagram (Future)

Instagram Basic Display API and Graph API are planned but not yet implemented.

---

## Environment Variables Template

Create `apps/web/.env.local`:

```env
# Database
DATABASE_URL="file:../../packages/database/dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Threads
THREADS_APP_ID=""
THREADS_APP_SECRET=""
THREADS_REDIRECT_URI="http://localhost:3000/auth/callback/threads"

# LinkedIn
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""
LINKEDIN_REDIRECT_URI="http://localhost:3000/auth/callback/linkedin"

# X (Optional - $100/month)
X_API_KEY=""
X_API_SECRET=""
X_ACCESS_TOKEN=""
X_ACCESS_SECRET=""
X_BEARER_TOKEN=""
```

## Testing Connections

After setup, test each platform:

```bash
# Run the test script
node scripts/test-connections.js
```

Or use the dashboard:
1. Go to Platforms tab
2. Click "Test Connection" on each connected platform
3. Should show green checkmark if working

## Troubleshooting

### "App not configured" error
- Check all env variables are set
- Restart the Next.js dev server
- Verify no typos in variable names

### OAuth callback fails
- Ensure redirect URI in app settings matches exactly
- Check state parameter is being passed correctly
- Look at browser dev console for error details

### Token expires quickly
- LinkedIn tokens expire in 2 months
- Threads tokens expire in 60 days
- The system should auto-refresh, but you may need to reconnect occasionally

### Rate limits
- Threads: 250 posts/day, 500 reads/hour
- LinkedIn: 500 posts/day
- X: Varies by tier (Basic: 3000 tweets/month)

## Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- OAuth tokens are stored encrypted in database
- Rotate secrets if you suspect compromise
- Use separate apps for dev vs production

## Next Steps

1. Connect your platforms using the dashboard
2. Set your platform modes (DRAFT+CRON or AUTOMATE)
3. Review and customize your voice profile
4. Let the agents start working!
