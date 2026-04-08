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
- **Tailwind CSS 4** (CSS-first, no tailwind.config) + **Apple Monochrome** design system (`css/theme.aidevbrain.css`)
- **Prisma 7** ORM → **PostgreSQL** (Supabase, `PrismaPg` driver adapter)
- **NextAuth v4** (credentials + Google OAuth, JWT strategy)
- **ReUI** component library (shadcn/ui-style, configured in `components.json`)
- **TanStack Query** (`useInfiniteQuery` for lists, `staleTime: Infinity, gcTime: 1h`)
- **react-hook-form** + **Zod** for forms
- **DM Sans** (body) + **JetBrains Mono** (monospace/data)
- **Package manager: pnpm**

### Route Groups

- `app/(auth)/` — Public auth pages (signin, signup, verify-email, reset-password, change-password, resend-verification)
- `app/(protected)/` — Authenticated pages. Redirects to `/signin` if unauthenticated. Uses `Demo1Layout` with sidebar.
- `app/api/` — API routes:
  - `auth/` — NextAuth + signup, verify-email, resend-verification
  - `orgs/` — Organization + member + API key CRUD
  - `projects/` — Domain entities: features, tasks, decisions, rules, docs, memory, context, activity
  - `user-management/` — Admin-only: users, roles, permissions (protected by `requireAdmin()`)
  - `mcp/` — MCP Streamable HTTP endpoint
  - `health/` — Health check

### Key Directories

- `app/models/` — TypeScript interfaces mirroring Prisma schema
- `config/` — App settings, menu config (sidebar nav defined inline in `sidebar-nav.tsx`)
- `providers/` — React context providers: Auth, Settings, Theme, i18n, Query, Modules, Tooltips
- `lib/auth.ts` — Dual auth with `AuthContext { userId, orgId, orgRole, authType, apiKeyId? }`
- `lib/admin-guard.ts` — `requireAdmin()` for user-management routes (checks `admin`/`owner` role slugs)
- `lib/services/` — Domain service layer with `PaginatedResult<T>` responses
- `lib/services/_helpers.ts` — `resolveProject`, `slugify`, `logActivity`, `toJsonInput`, `paginatedQuery`
- `lib/mcp/` — MCP server factory + 8 tool files (one per entity group)
- `hooks/` — `use-active-org`, `use-infinite-entity-query`, `use-intersection-observer`, `use-debounced-value`
- `components/ui/` — ReUI/shadcn components (Button, Input, Select, Sheet, Dialog, Badge, etc.)
- `css/theme.aidevbrain.css` — Apple Monochrome design tokens + `adb-*` utility classes

### Design System (Apple Monochrome)

- **Primary color**: `--primary` overridden to `zinc-900` (light) / `zinc-100` (dark) — monochrome, not blue
- **Cards**: Soft shadows (`adb-stat-card`, `adb-project-card`), no colored borders
- **Sidebar/Header**: `backdrop-blur-xl` translucency
- **Animations**: `adb-fade-in`, `adb-stagger` (cascading children)
- **Typography**: `adb-mono` for data values (JetBrains Mono)
- **Tabs**: `adb-tab` with foreground-colored underline
- **Button/Input sizing**: Apple-scale (h-10 default, h-11 large, rounded-lg)

## Database

Prisma 7 schema at `prisma/schema.prisma`. Connection split:
- **CLI** (`prisma.config.ts`) — `DIRECT_URL` (port 5432, direct) for migrations
- **Runtime** (`lib/prisma.ts`) — `PrismaPg` adapter with `DATABASE_URL` (port 6543, PgBouncer)

Core models: `User`, `UserRole`, `UserPermission`, `UserRolePermission`, `Account`, `Session`, `VerificationToken`, `SystemLog`, `SystemSetting`, `Organization`, `OrgMember`, `ApiKey`, `Project`, `Feature`, `Task`, `Decision`, `Rule`, `Document`, `Memory`, `Activity`.

## Authentication & Authorization

### Dual Authentication (`lib/auth.ts`)

- **Session** (NextAuth cookie) — for web UI. Org resolved from `X-Org-Id` header or auto-detected.
- **API Key** (`Authorization: Bearer adb_sk_...`) — for MCP/programmatic access. Org resolved from key.

Both return `AuthContext { userId, orgId, orgRole: 'OWNER' | 'ADMIN' | 'MEMBER', authType, apiKeyId? }`.

### Security Rules

- **API keys inherit the creator's CURRENT role** — demotion/removal takes effect immediately
- **Removed members' API keys stop working** — `resolveApiKey()` verifies org membership on every request
- **User Management routes** (`/api/user-management/users,roles,permissions`) — protected by `requireAdmin()` from `lib/admin-guard.ts`. Only `admin`/`owner` role slugs pass. Returns 403 for others.
- **Org routes** — `getAuthContext()` verifies org membership before serving data
- **New users get `member` role** (`isDefault: true`) — NOT admin
- **User Management removed from sidebar** — not visible to regular users
- **Protected records**: Some `User` and `UserRole` rows have `isProtected: true` — do not delete/modify

### `isOrgAdmin(auth)` helper

Returns `true` for OWNER/ADMIN roles. Use in routes that need org-level admin checks.

## MCP Server

Endpoint at `/api/mcp` using `WebStandardStreamableHTTPServerTransport` (stateless mode).

### Configuration (`.mcp.json`)

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

40 tools across 8 groups: `project.*`, `feature.*`, `task.*`, `decision.*`, `rule.*`, `document.*`, `memory.*`, `context.*` (onboard, summary, focus).

- `X-Project-Slug` header sets default project — tools use it as fallback when `project` param is omitted
- `project` param on any tool overrides the header
- All `list` tools support `limit`/`offset` pagination
- Service responses: `{ data: T[], pagination: { total, limit, offset, hasMore } }`

### Context Tools

- `context.onboard` — Full project dump for new AI sessions (features, tasks, decisions, rules, memory, activity)
- `context.summary` — Quick counts + recent activity
- `context.focus` — In-progress features and tasks only

## Pagination & Search

### Backend

All service `list()` methods accept `search?: string`, `limit?: number`, `offset?: number` and return `PaginatedResult<T>`.
- `paginatedQuery()` helper in `_helpers.ts` runs `findMany` + `count` in parallel
- Search uses Prisma `contains` with `mode: 'insensitive'` (ILIKE)
- API routes parse `?search=&limit=&offset=` query params

### Frontend

- `useInfiniteEntityQuery<T>()` — wraps TanStack `useInfiniteQuery` with project conventions
- `useIntersectionObserver()` — sentinel-based infinite scroll trigger
- `useDebouncedValue()` — 300ms debounce for search inputs
- Features (kanban) uses `useQuery` with `limit=200` (no infinite scroll — columns need all items)
- All other pages use infinite scroll with sentinel div

## Email

SMTP via nodemailer (`services/send-email.ts`). Port-aware TLS: `secure: port === 465`. Templates branded "AI Dev Brain".

## Environment

Copy `.env.example` to `.env.local`. Required: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_PATH`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SENDER`.

`.npmrc` sets `shamefully-hoist=true`, `auto-install-peers=true`, `strict-peer-dependencies=false`.
