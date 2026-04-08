# AI Dev Brain

Structured project intelligence for AI-assisted development. The persistent brain that both humans visualize through a web UI and AI agents query via [Model Context Protocol](https://modelcontextprotocol.io) (MCP).

## What It Does

AI Dev Brain gives your AI coding tools (Claude Code, Cursor, Windsurf) persistent access to your project's structured knowledge — decisions, rules, tasks, features, documents, and memory. Instead of re-explaining your codebase in every conversation, your AI agents query AI Dev Brain and get full context automatically.

### Core Entities

| Entity       | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| **Projects** | Top-level containers scoped to an organization             |
| **Features** | High-level capabilities with status tracking and priority  |
| **Tasks**    | Granular work items linked to features, with dependencies  |
| **Decisions** | Architectural choices with context, alternatives, and consequences |
| **Rules**    | Coding standards and constraints (scope: global/backend/frontend/API/etc.) |
| **Documents** | Specs, guides, runbooks, and reference material           |
| **Memory**   | Key-value persistent context (user, feedback, project, reference types) |

### MCP Integration

AI agents connect via a single config:

```json
{
  "mcpServers": {
    "ai-dev-brain": {
      "type": "streamable-http",
      "url": "https://your-instance.app/api/mcp",
      "headers": {
        "Authorization": "Bearer adb_sk_..."
      }
    }
  }
}
```

The MCP server exposes tools for every entity (`project.*`, `feature.*`, `task.*`, `decision.*`, `rule.*`, `document.*`, `memory.*`) plus context tools (`context.onboard`, `context.summary`, `context.focus`) that give AI agents instant project awareness.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 (CSS-first, no config file) + ReUI component library
- **Database**: PostgreSQL (Supabase) via Prisma 7 ORM with PgBouncer pooling
- **Auth**: NextAuth v4 — credentials + Google OAuth, dual auth (session cookies for web UI, API keys for MCP)
- **MCP**: `@modelcontextprotocol/sdk` with Streamable HTTP transport at `/api/mcp`
- **State**: TanStack Query (server state), react-hook-form + Zod (forms)
- **i18n**: i18next (EN, AR, ES, DE, CH) with RTL support
- **Storage**: S3-compatible (AWS S3 / DigitalOcean Spaces)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (or a Supabase project)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database URLs, auth secrets, etc.

# Deploy database schema
pnpm exec prisma db push

# Generate Prisma client
pnpm exec prisma generate

# Seed demo data
pnpm exec prisma db seed

# Start dev server
pnpm dev
```

### Environment Variables

| Variable                    | Required | Description                          |
| --------------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`              | Yes      | PostgreSQL connection (PgBouncer, port 6543) |
| `DIRECT_URL`                | Yes      | Direct PostgreSQL connection (port 5432, for migrations) |
| `NEXTAUTH_SECRET`           | Yes      | NextAuth encryption secret           |
| `NEXTAUTH_URL`              | Yes      | App base URL                         |
| `NEXT_PUBLIC_API_URL`       | Yes      | API base URL                         |
| `NEXT_PUBLIC_BASE_PATH`     | Yes      | Public base path                     |
| `GOOGLE_CLIENT_ID`          | No       | Google OAuth client ID               |
| `GOOGLE_CLIENT_SECRET`      | No       | Google OAuth secret                  |
| `STORAGE_*`                 | No       | S3-compatible storage config         |
| `SMTP_*`                    | No       | Email (verification, password reset) |
| `NEXT_PUBLIC_RECAPTCHA_*`   | No       | reCAPTCHA v2 keys                    |

## Project Structure

```
app/
  (marketing)/          # Public homepage
  (auth)/               # Sign in, sign up, password reset, email verification
  (protected)/          # Authenticated app (dashboard, projects, org, account)
    dashboard/          # Command center
    projects/           # Project listing + detail views
    org/                # Organization management (members, API keys, settings)
    onboarding/         # First-time setup wizard
  api/
    auth/               # NextAuth + custom endpoints
    mcp/                # MCP Streamable HTTP endpoint
    projects/           # Domain entity CRUD
    orgs/               # Organization + member + API key CRUD

lib/
  mcp/                  # MCP server factory + tool definitions
    tools/              # One file per entity group (9 tool files)
  services/             # Domain service layer
  schemas/              # Shared Zod validation schemas
  auth.ts               # Dual auth resolver (session + API key)
  prisma.ts             # Prisma singleton with PgBouncer adapter

prisma/
  schema.prisma         # Database schema
  seed.js               # Demo data seeder
```

## Authentication

Two auth paths via `lib/auth.ts`:

- **Session** (NextAuth cookie) — for the web UI. Organization resolved from `X-Org-Id` header or auto-detected for single-org users.
- **API Key** (`Authorization: Bearer adb_sk_...`) — for MCP and programmatic access. Organization resolved from the key.

Both return an `AuthContext { userId, orgId, authType, apiKeyId? }` used across all API routes and MCP tools.

## Commands

```bash
pnpm dev                            # Start dev server
pnpm build                          # Production build
pnpm build:staging                  # Build with .env.staging
pnpm lint                           # ESLint
pnpm format                         # Prettier (auto-sorts imports)
pnpm exec prisma db push            # Deploy schema changes
pnpm exec prisma generate           # Regenerate Prisma client
pnpm exec prisma db seed            # Seed demo data
```

## License

Private.
