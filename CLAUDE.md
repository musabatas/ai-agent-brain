# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Dev Brain** — a cloud-hosted project intelligence platform for AI-assisted development. Organizations manage projects containing features, tasks, decisions, rules, documents, and memory — all accessible via MCP from any AI tool.

## Commands

```bash
pnpm install                        # Install deps
pnpm dev                            # Start dev server (Next.js)
pnpm build                          # Production build
pnpm build:staging                  # Build with .env.staging → .env.local
pnpm lint                           # ESLint (flat config)
pnpm format                         # Prettier (auto-sorts imports)
pnpm exec prisma db push            # Deploy schema to database
pnpm exec prisma generate           # Regenerate Prisma client after schema changes
pnpm exec prisma db seed            # Seed database (prisma/seed.js)
node prisma/setup-search.js         # Setup FTS tsvector columns + GIN indexes
```

<IMPORTANT>
Never run, stop, start service unless user specifically requested. User already run "pnpm dev" in background.
</IMPORTANT>

## Architecture

### Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (CSS-first) + **Graphite macOS** design system (`src/app/globals.css`)
- **Prisma 7** ORM → **PostgreSQL** (Supabase, `PrismaPg` driver adapter)
- **NextAuth v4** (credentials + Google OAuth, JWT strategy)
- **shadcn/ui** components (`src/components/ui/`, configured in `components.json`)
- **TanStack Query** (`useInfiniteQuery` for lists, `staleTime: Infinity, gcTime: 1h`)
- **react-hook-form** + **Zod** for forms
- **Satoshi** (body, via next/font/local) + **JetBrains Mono** (monospace/data)
- **Package manager: pnpm**

### File Architecture — `src/` with Feature-Based Organization

```
src/
  app/                              # Next.js routes only
    globals.css                     # Single CSS file — Graphite macOS tokens
    layout.tsx                      # Root layout (fonts, providers)
    (auth)/                         # Public auth pages
    (marketing)/                    # Landing page
    (protected)/                    # Auth-gated pages
      dashboard/
      onboarding/
      projects/                     # Project list + [slug]/ detail pages
        [slug]/                     # Nested sidebar layout for project entities
          features/, tasks/, decisions/, rules/, documents/, memory/, mcp-config/
      org/                          # Organization settings, members, api-keys
      user-management/              # Admin CRUD (users, roles, permissions)
    api/                            # API routes (auth, orgs, projects, user-management, mcp, health)

  features/                         # Domain-specific business logic
    projects/
      services/                     # project, feature, task, decision, rule, document, memory, context, comment, revision
      schemas/                      # Zod validation schemas
      components/                   # project-card, project-context, analytics-charts, form dialogs
    org/
      services/                     # org, api-key
      schemas/
      components/                   # api-key-create-dialog, member-invite-dialog
    mcp/
      server.ts                     # MCP server factory
      tools/                        # 10 tool files (one per entity group)
    notifications/services/
    webhooks/services/
    audit/services/

  components/
    ui/                             # shadcn/ui primitives (managed by CLI)
    common/                         # Shared: container, toolbar, content-loader, markdown-editor, delete-confirm-dialog, user-dropdown-menu, etc.
    layouts/main/                   # Shell: sidebar, header, footer, org-switcher, global-search, breadcrumb

  lib/                              # Shared server utilities
    auth.ts                         # Dual auth (session + API key) → AuthContext
    admin-guard.ts                  # requireAdmin() for user-management routes
    prisma.ts                       # Prisma client (PrismaPg adapter)
    api.ts, api-error.ts, api-response.ts  # API utilities
    rate-limit.ts                   # In-memory rate limiting
    mcp-config.ts                   # DRY MCP config generator (used by onboarding + MCP config page)
    services/_helpers.ts            # resolveProject, slugify, logActivity, paginatedQuery

  hooks/                            # use-active-org, use-infinite-entity-query, use-intersection-observer, use-debounced-value, etc.
  providers/                        # Auth, Settings, Theme, i18n, Query, Modules, Tooltips
  config/                           # constants.ts, menu.config.tsx, settings.config.ts
  models/                           # TypeScript interfaces (project, user, org, system)
  types/                            # Type declarations (.d.ts)
  i18n/                             # Internationalization
```

### Path Alias

`@/*` resolves to `./src/*` (single mapping in `tsconfig.json`).

### Route Groups

- `src/app/(auth)/` — Public auth pages (signin, signup, verify-email, reset-password, change-password)
- `src/app/(protected)/` — Authenticated pages. Redirects to `/signin` if unauthenticated.
- `src/app/api/` — API routes

### Design System (Graphite macOS)

Single CSS file: `src/app/globals.css`. No custom CSS classes — pure Tailwind + shadcn/ui.

- **Surface hierarchy**: `bg-surface-1` (body/shell) → `bg-background` (content area) → `bg-card` (elevated)
- **Primary**: Monochrome graphite — `#1a1a1a` (light) / `#ececec` (dark)
- **Borders**: `rgba(0,0,0,0.10)` (light) / `rgba(255,255,255,0.07)` (dark) — transparent, not opaque
- **Sidebar**: Translucent `backdrop-blur-xl`, pin/unpin toggle, auto-expand on hover when unpinned
- **Dark mode**: Near-black `#0a0a0a` background, `#111111` cards
- **Scrollbars**: macOS overlay style with transparent track
- **Typography**: 14px body base, 12px (`text-xs`) minimum readable size — no text below 12px
- **Muted foreground**: `#52525b` (light) / `#8c8c8c` (dark) — WCAG AA compliant contrast

### Project Detail Layout

Project pages use a **nested sidebar** layout (not tabs):
- Left: 220px sidebar with project name, status, entity navigation (Overview, Features, Tasks, etc.)
- Right: Content area for the active entity page
- Mobile: Horizontal scrollable nav below header

## Database

Prisma 7 schema at `prisma/schema.prisma`. Connection split:
- **CLI** (`prisma.config.ts`) — `DIRECT_URL` (port 5432, direct) for migrations
- **Runtime** (`src/lib/prisma.ts`) — `PrismaPg` adapter with `DATABASE_URL` (port 6543, PgBouncer)

Core models: `User`, `UserRole`, `UserPermission`, `UserRolePermission`, `Account`, `Session`, `VerificationToken`, `SystemLog`, `SystemSetting`, `Organization`, `OrgMember`, `ApiKey`, `Project`, `Feature`, `Task`, `Decision`, `Rule`, `Document`, `Memory`, `Activity`, `Comment`, `Revision`, `Notification`, `AuditLog`, `Webhook`.

## Authentication & Authorization

### Dual Authentication (`src/lib/auth.ts`)

- **Session** (NextAuth cookie) — for web UI. Org resolved from `X-Org-Id` header or auto-detected.
- **API Key** (`Authorization: Bearer adb_sk_...`) — for MCP/programmatic access. Org resolved from key.

Both return `AuthContext { userId, orgId, orgRole: 'OWNER' | 'ADMIN' | 'MEMBER', authType, apiKeyId? }`.

### `useActiveOrgId()` hook

Returns active org ID. Priority: `settings.activeOrgId` > `session.defaultOrgId` > `adb-org-id` cookie fallback.

### Security Rules

- **API keys inherit the creator's CURRENT role** — demotion/removal takes effect immediately
- **Removed members' API keys stop working** — `resolveApiKey()` verifies org membership on every request
- **User Management routes** (`/api/user-management/users,roles,permissions`) — protected by `requireAdmin()` from `src/lib/admin-guard.ts`
- **Org routes** — `getAuthContext()` verifies org membership before serving data
- **New users get `member` role** (`isDefault: true`) — NOT admin
- **Protected records**: Some `User` and `UserRole` rows have `isProtected: true` — do not delete/modify

## MCP Server

Endpoint at `/api/mcp` using `WebStandardStreamableHTTPServerTransport` (stateless mode).

### Configuration

Generated by `src/lib/mcp-config.ts` (DRY — used by onboarding page and MCP config tab).

```json
{
  "mcpServers": {
    "ai-dev-brain": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "X-Project-Slug": "your-project-slug"
      }
    }
  }
}
```

### Tools

40+ tools across 10 groups: `project.*`, `feature.*`, `task.*`, `decision.*`, `rule.*`, `document.*`, `memory.*`, `context.*`, `comment.*`, `import.*`.

- `X-Project-Slug` header sets default project — agents should NOT pass `project` param unless targeting a different project
- All `list` tools support `limit`/`offset` pagination
- Service responses: `{ data: T[], pagination: { total, limit, offset, hasMore } }`

### Context Tools

- `context.onboard` — Full project dump for new AI sessions
- `context.summary` — Quick counts + recent activity
- `context.focus` — In-progress features and tasks only

## Pagination & Search

### Backend

All service `list()` methods accept `search?: string`, `limit?: number`, `offset?: number` and return `PaginatedResult<T>`.
- `paginatedQuery()` helper in `src/lib/services/_helpers.ts` runs `findMany` + `count` in parallel
- Search uses Prisma `contains` with `mode: 'insensitive'` (ILIKE)

### Frontend

- `useInfiniteEntityQuery<T>()` — wraps TanStack `useInfiniteQuery` with project conventions
- `useIntersectionObserver()` — sentinel-based infinite scroll trigger
- `useDebouncedValue()` — 300ms debounce for search inputs
- Features (kanban) uses `useQuery` with `limit=200` (no infinite scroll — columns need all items)
- All other pages use infinite scroll with sentinel div

## Email

SMTP via nodemailer (`src/lib/services/send-email.ts`). Port-aware TLS: `secure: port === 465`. Templates branded "AI Dev Brain".

## Environment

Copy `.env.example` to `.env.local`. Required: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_PATH`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SENDER`.

`.npmrc` sets `shamefully-hoist=true`, `auto-install-peers=true`, `strict-peer-dependencies=false`.
