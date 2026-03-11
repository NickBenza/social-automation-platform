# Social Media Community Engagement Platform

A full-stack multi-agent social media automation platform for marketing leaders.

## Features

- **Multi-Platform Support**: Threads, X, LinkedIn, Instagram, Facebook, TikTok, YouTube, Bluesky, Mastodon, Pinterest, Reddit
- **Three Automation Modes**: OFF, Draft+Cron, Full Automation
- **AI Agents**: Content Generator, Engagement Manager, Trend Scanner, Analytics Reporter
- **Voice Profile Learning**: Analyzes your existing content to match your tone
- **Dashboard**: Full UI for managing all platforms and agents

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node.js 22+ with tRPC
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis
- **Agents**: Python 3.11+ with LangChain
- **LLM**: Kimi K2.5 via Ollama (local) with cloud fallback
- **Containerization**: Docker Compose

## Quick Start

### For End Users (Connecting Social Accounts)

1. **Open the dashboard** at `http://localhost:3000`
2. **Click "Connect Threads" or "Connect LinkedIn"** buttons
3. **Follow the OAuth flow** - you'll be redirected to the platform to authorize
4. **Done!** Your account is now connected and agents can start working

No API keys or .env files needed - the app handles everything through OAuth.

### For Developers (Local Setup)

```bash
# Clone and setup
git clone <repo>
cd social-automation-platform

# Install dependencies
cd apps/web && npm install
cd ../../packages/database && npm install

# Setup database
cd packages/database
npx prisma migrate dev
npm run seed

# Start the app
cd ../../apps/web
npm run dev
```

### Connecting Platforms

The app includes a **self-service OAuth flow** for customers:

1. Click any "Connect" button in the dashboard
2. A modal explains what will happen
3. Click "Start Connection" to open OAuth popup
4. Sign in to the platform and authorize the app
5. You're automatically redirected back with tokens stored securely

**Supported Platforms:**
- ✅ **Threads** (Meta) - Free, requires Meta app setup
- ✅ **LinkedIn** - Free, requires LinkedIn app setup  
- ⚠️ **X (Twitter)** - Requires $100/month API subscription
- 🚧 Instagram, TikTok, others - Coming soon

**Note:** For production, you'll need to create apps on Meta Developer and LinkedIn Developer portals to get OAuth credentials.

## Project Structure

```
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # API server
├── packages/
│   ├── agents/              # Python agent orchestration
│   ├── connectors/          # Social platform adapters
│   ├── database/            # Prisma schema + client
│   └── shared/              # Shared types and utils
├── docker-compose.yml
└── README.md
```

## Development Status

🚧 Currently building MVP - Phase 1

See IMPLEMENTATION.md for detailed roadmap.

## License

MIT