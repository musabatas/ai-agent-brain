/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rolesData = require('./data/roles');
const usersData = require('./data/users');
const permissionsData = require('./data/permissions');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Running database seeding...');

  await prisma.$transaction(
    async (tx) => {
      // Ensure the owner role exists
      const ownerRole = await tx.userRole.upsert({
        where: { slug: 'owner' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          slug: 'owner',
          name: 'Owner',
          description: 'The default system role with full access.',
          isProtected: true,
          isDefault: false, // Optional: set to false if it's not the default role
        },
      });

      // Create the owner user
      const hashedPassword = await bcrypt.hash('123456', 10);
      const demoPassword = await bcrypt.hash('demo123', 10);

      await tx.user.upsert({
        where: { email: 'demo@kt.com' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          email: 'demo@kt.com',
          name: 'Demo',
          password: demoPassword,
          roleId: ownerRole.id,
          avatar: null, // Optional: Add avatar URL if available
          emailVerifiedAt: new Date(), // Optional: Mark email as verified
          status: 'ACTIVE',
        },
      });

      const ownerUser = await tx.user.upsert({
        where: { email: 'owner@kt.com' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          email: 'owner@kt.com',
          name: 'System Owner',
          password: hashedPassword,
          roleId: ownerRole.id,
          avatar: null, // Optional: Add avatar URL if available
          emailVerifiedAt: new Date(), // Optional: Mark email as verified
          status: 'ACTIVE',
        },
      });

      // Seed UserRoles
      await tx.userRole.upsert({
        where: { slug: 'member' },
        update: {}, // No updates needed, ensures idempotency
        create: {
          slug: 'member',
          name: 'Member',
          description: 'Default member role',
          isDefault: true,
          isProtected: true,
          createdAt: new Date(),
        },
      });

      // Seed Roles
      for (const role of rolesData) {
        await tx.userRole.upsert({
          where: { slug: role.slug },
          update: {},
          create: {
            slug: role.slug,
            name: role.name,
            description: role.description,
            isDefault: role.isDefault || false,
            isProtected: role.isProtected || false,
            createdAt: new Date(),
            createdByUserId: ownerUser.id,
          },
        });
      }
      console.log('Roles seeded.');

      // Seed Permissions
      for (const permission of permissionsData) {
        await tx.userPermission.upsert({
          where: { slug: permission.slug },
          update: {},
          create: {
            slug: permission.slug,
            name: permission.name,
            description: permission.description,
            createdAt: new Date(),
            createdByUserId: ownerUser.id,
          },
        });
      }
      console.log('Permissions seeded.');

      // Seed Role Permissions
      const seededRoles = await tx.userRole.findMany();
      const seededPermissions = await tx.userPermission.findMany();

      const userRolePermissionPromises = seededRoles.flatMap((role) => {
        // Generate a random number between 3 and 12 (inclusive)
        const numberOfPermissions =
          Math.floor(Math.random() * (12 - 3 + 1)) + 3;

        // Randomly shuffle the permissions array and select the required number
        const randomizedPermissions = seededPermissions
          .sort(() => Math.random() - 0.5)
          .slice(0, numberOfPermissions);

        // Create promises for each selected permission
        return randomizedPermissions.map((permission) =>
          tx.userRolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
              assignedAt: new Date(),
            },
          }),
        );
      });

      await Promise.all(userRolePermissionPromises);
      console.log('UserRolePermissions seeded.');

      // Seed Users
      for (const user of usersData) {
        const role = await tx.userRole.findFirst({
          where: { slug: user.roleSlug },
        });
        await tx.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            name: user.name,
            password: hashedPassword,
            avatar: user.avatar ? '/media/avatars/' + user.avatar : null,
            roleId: role.id,
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
            createdAt: new Date(),
          },
        });
      }
      console.log('Users seeded.');

      // Fetch admin users with roles that are not marked as isDefault
      const users = await tx.user.findMany({
        where: {
          role: {
            isDefault: false, // Exclude default roles
          },
        },
        include: {
          role: true, // Include role details if needed
        },
      });

      // Seed AuditLogs
      const meaningfulVerbs = [
        'created',
        'updated',
        'deleted',
        'requested',
        'reset',
        'terminated',
        'fetched',
        'reviewed',
      ];

      const systemLogPromises = Array.from({ length: 20 }).map(() => {
        const entity = faker.helpers.arrayElement([
          { type: 'user', id: faker.helpers.arrayElement(users).id },
        ]);

        const event = faker.helpers.arrayElement([
          'CREATE',
          'UPDATE',
          'DELETE',
          'FETCH',
        ]);

        // Map meaningful verbs based on the event type
        const verbMap = {
          CREATE: ['created', 'added', 'initialized', 'generated'],
          UPDATE: ['updated', 'modified', 'changed', 'edited'],
          DELETE: ['deleted', 'removed', 'cleared', 'erased'],
          FETCH: ['fetched', 'retrieved', 'requested', 'accessed'],
        };

        const descriptionVerb = faker.helpers.arrayElement(
          verbMap[event] || meaningfulVerbs, // Fallback to the generic meaningfulVerbs
        );

        return tx.systemLog.create({
          data: {
            event,
            userId: faker.helpers.arrayElement(users).id,
            entityId: entity.id,
            entityType: entity.type,
            description: `${entity.type} was ${descriptionVerb}`,
            createdAt: new Date(),
            ipAddress: faker.internet.ipv4(),
          },
        });
      });

      await Promise.all(systemLogPromises);

      // Seed Settings
      await tx.systemSetting.create({
        data: {
          name: 'AI Dev Brain',
        },
      });
      console.log('Settings seeded.');

      console.log('Database seeding completed!');
    },
    {
      timeout: 520000,
      maxWait: 520000,
    },
  );
}

async function seedAiDevBrain() {
  console.log('\nSeeding AI Dev Brain data...');

  await prisma.$transaction(
    async (tx) => {
      // ── Resolve demo & owner users ──
      const demoUser = await tx.user.findFirst({
        where: { email: 'demo@kt.com' },
      });
      const ownerUser = await tx.user.findFirst({
        where: { email: 'owner@kt.com' },
      });

      if (!demoUser || !ownerUser) {
        console.log(
          'Skipping AI Dev Brain seed: demo@kt.com or owner@kt.com not found.',
        );
        return;
      }

      // ── Helper: upsert team by slug ──
      const ensurePersonalTeam = async (user, slug) => {
        const existing = await tx.organization.findUnique({ where: { slug } });
        if (existing) return existing;
        const team = await tx.organization.create({
          data: {
            name: `${user.name}'s Team`,
            slug,
          },
        });
        await tx.orgMember.create({
          data: { orgId: team.id, userId: user.id, role: 'OWNER' },
        });
        return team;
      };

      const demoTeam = await ensurePersonalTeam(demoUser, 'demo-personal');
      const ownerTeam = await ensurePersonalTeam(ownerUser, 'owner-personal');
      console.log('Teams seeded.');

      // ── Project ──
      let project = await tx.project.findFirst({
        where: { orgId: ownerTeam.id, slug: 'ai-dev-brain' },
      });
      if (!project) {
        project = await tx.project.create({
          data: {
            orgId: ownerTeam.id,
            name: 'AI Dev Brain',
            slug: 'ai-dev-brain',
            description:
              'A structured project intelligence system for AI-assisted development.',
            status: 'ACTIVE',
          },
        });
      }
      console.log('Project seeded.');

      // ── Features ──
      const featureDefs = [
        {
          title: 'User Authentication',
          status: 'DONE',
          priority: 'P0',
          description:
            'OAuth2 + credentials auth with NextAuth, session management, and role-based access control.',
        },
        {
          title: 'MCP Server',
          status: 'IN_PROGRESS',
          priority: 'P0',
          description:
            'Model Context Protocol server exposing project intelligence via standardized tool calls.',
        },
        {
          title: 'Web Dashboard',
          status: 'IN_PROGRESS',
          priority: 'P1',
          description:
            'Interactive web UI for managing projects, features, decisions, rules, and documents.',
        },
        {
          title: 'Search & Analytics',
          status: 'BACKLOG',
          priority: 'P1',
          description:
            'Full-text search across all entities with PostgreSQL tsvector and usage analytics dashboard.',
        },
      ];

      const features = [];
      for (let i = 0; i < featureDefs.length; i++) {
        const def = featureDefs[i];
        const existing = await tx.feature.findFirst({
          where: { projectId: project.id, title: def.title },
        });
        if (existing) {
          features.push(existing);
        } else {
          features.push(
            await tx.feature.create({
              data: {
                projectId: project.id,
                title: def.title,
                description: def.description,
                status: def.status,
                priority: def.priority,
                sortOrder: i,
              },
            }),
          );
        }
      }
      console.log('Features seeded.');

      // ── Tasks ──
      const taskDefs = [
        {
          featureIdx: 0,
          title: 'Implement NextAuth credentials provider',
          status: 'DONE',
          priority: 'P0',
          tags: ['auth', 'backend'],
        },
        {
          featureIdx: 0,
          title: 'Add Google OAuth provider',
          status: 'DONE',
          priority: 'P1',
          tags: ['auth', 'oauth'],
        },
        {
          featureIdx: 0,
          title: 'Build email verification flow',
          status: 'DONE',
          priority: 'P1',
          tags: ['auth', 'email'],
        },
        {
          featureIdx: 1,
          title: 'Define MCP tool schemas for CRUD operations',
          status: 'IN_PROGRESS',
          priority: 'P0',
          tags: ['mcp', 'api'],
        },
        {
          featureIdx: 1,
          title: 'Implement project context retrieval tool',
          status: 'TODO',
          priority: 'P0',
          tags: ['mcp', 'context'],
        },
        {
          featureIdx: 1,
          title: 'Add API key authentication middleware',
          status: 'IN_PROGRESS',
          priority: 'P0',
          tags: ['mcp', 'auth', 'middleware'],
        },
        {
          featureIdx: 2,
          title: 'Create project overview dashboard page',
          status: 'IN_PROGRESS',
          priority: 'P1',
          tags: ['dashboard', 'frontend'],
        },
        {
          featureIdx: 2,
          title: 'Build decision log management UI',
          status: 'TODO',
          priority: 'P2',
          tags: ['dashboard', 'decisions'],
        },
        {
          featureIdx: 3,
          title: 'Set up PostgreSQL full-text search with tsvector',
          status: 'TODO',
          priority: 'P1',
          tags: ['search', 'database'],
        },
        {
          featureIdx: 3,
          title: 'Implement cross-entity search API endpoint',
          status: 'BLOCKED',
          priority: 'P1',
          tags: ['search', 'api'],
        },
      ];

      const tasks = [];
      for (let i = 0; i < taskDefs.length; i++) {
        const def = taskDefs[i];
        const existing = await tx.task.findFirst({
          where: { projectId: project.id, title: def.title },
        });
        if (existing) {
          tasks.push(existing);
        } else {
          tasks.push(
            await tx.task.create({
              data: {
                projectId: project.id,
                featureId: features[def.featureIdx].id,
                title: def.title,
                description: faker.lorem.paragraph(),
                status: def.status,
                priority: def.priority,
                sortOrder: i,
                tags: def.tags,
                completedAt: def.status === 'DONE' ? new Date() : null,
              },
            }),
          );
        }
      }
      console.log('Tasks seeded.');

      // ── Decisions ──
      const decisionDefs = [
        {
          title: 'Use NextAuth v4 over v5 beta',
          status: 'ACCEPTED',
          context:
            'NextAuth v5 is still in beta with breaking changes. Production stability is critical for the auth layer.',
          decision:
            'Stick with NextAuth v4 which is battle-tested and well-documented. Migrate to v5 once stable.',
          consequences:
            'May need migration effort later, but avoids beta instability now.',
          tags: ['auth', 'dependencies'],
        },
        {
          title: 'PostgreSQL full-text search over Elasticsearch',
          status: 'ACCEPTED',
          context:
            'Need search across tasks, decisions, rules, and documents. Volume is moderate (<100K records).',
          decision:
            'Use native PostgreSQL tsvector/GIN indexes. Avoids operational overhead of a separate search service.',
          consequences:
            'Simpler infrastructure. May need to revisit if search requirements grow significantly.',
          tags: ['search', 'architecture'],
        },
        {
          title: 'Adopt MCP protocol for AI tool integration',
          status: 'PROPOSED',
          context:
            'Multiple AI coding assistants need structured access to project intelligence data.',
          decision:
            'Implement Model Context Protocol server as the primary integration point for AI tools.',
          consequences:
            'Standardized interface but locks into MCP ecosystem. Need fallback REST API.',
          tags: ['mcp', 'architecture', 'ai'],
        },
        {
          title: 'Use Prisma over raw SQL for ORM',
          status: 'PROPOSED',
          context:
            'Need type-safe database access with good migration tooling. Team familiar with Prisma.',
          decision:
            'Prisma provides type safety, migrations, and seeding out of the box. Use $queryRaw for complex queries.',
          consequences:
            'Some performance overhead vs raw SQL. Complex aggregations may need raw queries.',
          tags: ['database', 'orm'],
        },
        {
          title: 'REST API over GraphQL',
          status: 'DEPRECATED',
          context:
            'Initially considered GraphQL for flexible querying, but MCP protocol handles AI tool queries.',
          decision:
            'REST API is simpler for dashboard CRUD. MCP handles the flexible query needs for AI tools.',
          consequences:
            'Less flexible for frontend but simpler to maintain. MCP fills the gap for AI consumers.',
          tags: ['api', 'architecture'],
        },
      ];

      for (const def of decisionDefs) {
        const existing = await tx.decision.findFirst({
          where: { projectId: project.id, title: def.title },
        });
        if (!existing) {
          await tx.decision.create({
            data: {
              projectId: project.id,
              title: def.title,
              status: def.status,
              context: def.context,
              decision: def.decision,
              consequences: def.consequences,
              tags: def.tags,
            },
          });
        }
      }
      console.log('Decisions seeded.');

      // ── Rules ──
      const ruleDefs = [
        {
          title: 'All API routes must validate input with Zod',
          content:
            'Every API route handler must parse request body/params/query through a Zod schema before processing. Return 400 with structured error on validation failure.',
          scope: 'API',
          enforcement: 'MUST',
          tags: ['validation', 'security'],
        },
        {
          title: 'Use server components by default',
          content:
            'Pages and layouts should be React Server Components unless they need interactivity. Mark client components explicitly with "use client" directive.',
          scope: 'FRONTEND',
          enforcement: 'SHOULD',
          tags: ['react', 'performance'],
        },
        {
          title: 'Database queries must use Prisma transactions for multi-step operations',
          content:
            'Any operation that creates/updates/deletes multiple records must be wrapped in prisma.$transaction() to ensure atomicity.',
          scope: 'DATABASE',
          enforcement: 'MUST',
          tags: ['prisma', 'consistency'],
        },
        {
          title: 'Environment variables must not be committed',
          content:
            'Never commit .env or .env.local files. Use .env.example with placeholder values. CI/CD must inject secrets at deploy time.',
          scope: 'GLOBAL',
          enforcement: 'MUST',
          tags: ['security', 'devops'],
        },
        {
          title: 'Prefer named exports over default exports',
          content:
            'Use named exports for better tree-shaking, IDE auto-import support, and refactoring safety. Exception: Next.js page/layout components which require default exports.',
          scope: 'FRONTEND',
          enforcement: 'SHOULD',
          tags: ['code-style', 'typescript'],
        },
        {
          title: 'Log structured JSON in production',
          content:
            'Production logging should output structured JSON with consistent fields: timestamp, level, message, context. Use console.log in development only.',
          scope: 'BACKEND',
          enforcement: 'MAY',
          tags: ['logging', 'observability'],
        },
      ];

      for (const def of ruleDefs) {
        const existing = await tx.rule.findFirst({
          where: { projectId: project.id, title: def.title },
        });
        if (!existing) {
          await tx.rule.create({
            data: {
              projectId: project.id,
              title: def.title,
              content: def.content,
              scope: def.scope,
              enforcement: def.enforcement,
              tags: def.tags,
            },
          });
        }
      }
      console.log('Rules seeded.');

      // ── Documents ──
      const docDefs = [
        {
          title: 'AI Dev Brain Architecture Spec',
          type: 'SPEC',
          content: `# AI Dev Brain Architecture

## Overview
AI Dev Brain is a structured project intelligence system that stores architectural decisions, coding rules, task breakdowns, and contextual memory for AI-assisted development.

## Components
1. **Web Dashboard** — Next.js app for human management of project intelligence
2. **MCP Server** — Model Context Protocol server for AI tool integration
3. **REST API** — Standard CRUD endpoints for dashboard and external consumers
4. **PostgreSQL** — Primary data store with full-text search capabilities

## Data Flow
AI tools connect via MCP protocol → Server validates API key → Queries project data → Returns structured context`,
          tags: ['architecture', 'overview'],
        },
        {
          title: 'Local Development Setup Guide',
          type: 'GUIDE',
          content: `# Local Development Setup

## Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Supabase account)
- pnpm or npm

## Steps
1. Clone the repository
2. Copy \`.env.example\` to \`.env.local\` and fill in values
3. Run \`npm install --force\` (--force needed for React 19 peer conflicts)
4. Run \`npx prisma db push\` to sync schema
5. Run \`npx prisma db seed\` to seed data
6. Run \`npm run dev\` to start the dev server

## Common Issues
- If Prisma client errors: run \`npx prisma generate\`
- If peer dependency errors: ensure \`.npmrc\` has \`legacy-peer-deps=true\``,
          tags: ['onboarding', 'development'],
        },
        {
          title: 'MCP Integration Notes',
          type: 'NOTE',
          content: `# MCP Integration Notes

## Current Status
- Tool schemas defined for: list_tasks, get_decision, create_rule, search
- Auth via API key in x-api-key header (SHA-256 hashed, stored in ApiKey table)
- Rate limiting not yet implemented

## Open Questions
- Should we support streaming responses for large context dumps?
- How to handle concurrent writes from multiple AI agents?
- Need to define conflict resolution strategy for rule updates`,
          tags: ['mcp', 'integration', 'wip'],
        },
      ];

      for (const def of docDefs) {
        const existing = await tx.document.findFirst({
          where: { projectId: project.id, title: def.title },
        });
        if (!existing) {
          await tx.document.create({
            data: {
              projectId: project.id,
              title: def.title,
              content: def.content,
              type: def.type,
              tags: def.tags,
            },
          });
        }
      }
      console.log('Documents seeded.');

      // ── Memories ──
      const memoryDefs = [
        {
          key: 'tech_stack',
          value:
            'Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL, NextAuth v4, TanStack Query',
          type: 'PROJECT',
          tags: ['stack', 'overview'],
        },
        {
          key: 'deployment_target',
          value:
            'Vercel for frontend, Supabase for PostgreSQL. Staging and production environments with separate databases.',
          type: 'PROJECT',
          tags: ['deployment', 'infrastructure'],
        },
        {
          key: 'preferred_patterns',
          value:
            'Server components by default, Zod validation on all inputs, TanStack Query for client-side data fetching, react-hook-form for forms.',
          type: 'USER',
          tags: ['preferences', 'patterns'],
        },
        {
          key: 'last_reviewed_pr',
          value:
            'PR #42 — Added MCP tool schema definitions. Approved with minor comments on error handling.',
          type: 'FEEDBACK',
          tags: ['review', 'mcp'],
        },
        {
          key: 'prisma_gotchas',
          value:
            'Use --force for npm install due to React 19 peer conflicts. Always run prisma generate after schema changes. Use $transaction for multi-step writes.',
          type: 'REFERENCE',
          tags: ['prisma', 'tips'],
        },
      ];

      for (const def of memoryDefs) {
        await tx.memory.upsert({
          where: {
            projectId_key: { projectId: project.id, key: def.key },
          },
          update: {},
          create: {
            projectId: project.id,
            key: def.key,
            value: def.value,
            type: def.type,
            tags: def.tags,
          },
        });
      }
      console.log('Memories seeded.');

      // ── Activities ──
      const existingActivities = await tx.activity.count({
        where: { projectId: project.id },
      });
      if (existingActivities === 0) {
        const activityDefs = [
          {
            action: 'created',
            entityType: 'project',
            summary: 'Created project AI Dev Brain',
          },
          {
            action: 'created',
            entityType: 'feature',
            summary: 'Added feature: User Authentication',
          },
          {
            action: 'updated',
            entityType: 'feature',
            summary: 'Marked User Authentication as DONE',
          },
          {
            action: 'created',
            entityType: 'decision',
            summary: 'Proposed: Use NextAuth v4 over v5 beta',
          },
          {
            action: 'updated',
            entityType: 'decision',
            summary: 'Accepted: Use NextAuth v4 over v5 beta',
          },
          {
            action: 'created',
            entityType: 'rule',
            summary: 'Added rule: All API routes must validate input with Zod',
          },
          {
            action: 'created',
            entityType: 'task',
            summary: 'Created task: Define MCP tool schemas',
          },
          {
            action: 'updated',
            entityType: 'task',
            summary:
              'Started task: Implement project context retrieval tool',
          },
          {
            action: 'created',
            entityType: 'document',
            summary: 'Added spec: AI Dev Brain Architecture Spec',
          },
          {
            action: 'created',
            entityType: 'memory',
            summary: 'Stored memory: tech_stack',
          },
        ];

        const now = Date.now();
        for (let i = 0; i < activityDefs.length; i++) {
          const def = activityDefs[i];
          await tx.activity.create({
            data: {
              projectId: project.id,
              actorType: 'user',
              actorId: ownerUser.id,
              action: def.action,
              entityType: def.entityType,
              entityId: project.id,
              summary: def.summary,
              createdAt: new Date(now - (activityDefs.length - i) * 3600000),
            },
          });
        }
      }
      console.log('Activities seeded.');

      // ── API Key ──
      const testKeyRaw =
        'adb_sk_dev_test_key_do_not_use_in_production_1234';
      const testKeyHash = crypto
        .createHash('sha256')
        .update(testKeyRaw)
        .digest('hex');

      const existingKey = await tx.apiKey.findUnique({
        where: { keyHash: testKeyHash },
      });
      if (!existingKey) {
        await tx.apiKey.create({
          data: {
            orgId: ownerTeam.id,
            createdById: ownerUser.id,
            name: 'Development Test Key',
            keyPrefix: 'adb_sk_dev_test',
            keyHash: testKeyHash,
            isActive: true,
          },
        });
      }
      console.log('API Key seeded.');

      console.log('AI Dev Brain seeding completed!');
    },
    {
      timeout: 520000,
      maxWait: 520000,
    },
  );
}

main()
  .then(() => seedAiDevBrain())
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
