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

```bash
# Clone and setup
git clone <repo>
cd social-automation-platform

# Start with Docker
docker-compose up -d

# Or local development
npm install
npx prisma migrate dev
npm run dev
```

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