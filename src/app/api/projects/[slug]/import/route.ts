import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, created, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { featureService } from '@/features/projects/services/feature.service';
import { taskService } from '@/features/projects/services/task.service';
import { decisionService } from '@/features/projects/services/decision.service';
import { ruleService } from '@/features/projects/services/rule.service';
import { documentService } from '@/features/projects/services/document.service';
import { memoryService } from '@/features/projects/services/memory.service';
import { CreateFeatureSchema, UpdateFeatureSchema } from '@/features/projects/schemas/feature.schema';
import { CreateTaskSchema, UpdateTaskSchema } from '@/features/projects/schemas/task.schema';
import { CreateDecisionSchema, UpdateDecisionSchema } from '@/features/projects/schemas/decision.schema';
import { CreateRuleSchema, UpdateRuleSchema } from '@/features/projects/schemas/rule.schema';
import { CreateDocumentSchema, UpdateDocumentSchema } from '@/features/projects/schemas/document.schema';
import { UpsertMemorySchema } from '@/features/projects/schemas/memory.schema';

const ENTITY_CONFIG = {
  feature: {
    createSchema: CreateFeatureSchema,
    updateSchema: UpdateFeatureSchema,
    create: (auth: any, slug: string, data: any) => featureService.create(auth, slug, data),
    update: (auth: any, slug: string, id: string, data: any) => featureService.update(auth, slug, id, data),
  },
  task: {
    createSchema: CreateTaskSchema,
    updateSchema: UpdateTaskSchema,
    create: (auth: any, slug: string, data: any) => taskService.create(auth, slug, data),
    update: (auth: any, slug: string, id: string, data: any) => taskService.update(auth, slug, id, data),
  },
  decision: {
    createSchema: CreateDecisionSchema,
    updateSchema: UpdateDecisionSchema,
    create: (auth: any, slug: string, data: any) => decisionService.create(auth, slug, data),
    update: (auth: any, slug: string, id: string, data: any) => decisionService.update(auth, slug, id, data),
  },
  rule: {
    createSchema: CreateRuleSchema,
    updateSchema: UpdateRuleSchema,
    create: (auth: any, slug: string, data: any) => ruleService.create(auth, slug, data),
    update: (auth: any, slug: string, id: string, data: any) => ruleService.update(auth, slug, id, data),
  },
  document: {
    createSchema: CreateDocumentSchema,
    updateSchema: UpdateDocumentSchema,
    create: (auth: any, slug: string, data: any) => documentService.create(auth, slug, data),
    update: (auth: any, slug: string, id: string, data: any) => documentService.update(auth, slug, id, data),
  },
  memory: {
    createSchema: UpsertMemorySchema,
    updateSchema: UpsertMemorySchema,
    create: (auth: any, slug: string, data: any) => memoryService.upsert(auth, slug, data),
    update: (auth: any, slug: string, _id: string, data: any) => memoryService.upsert(auth, slug, data),
  },
} as const;

type EntityType = keyof typeof ENTITY_CONFIG;

/**
 * Unified import endpoint — accepts entity data via REST.
 *
 * Designed for token-efficient imports: agents can POST file content
 * via curl/fetch (bypassing model output token generation) instead of
 * passing large content through MCP tool parameters.
 *
 * Body: { entity, action, id?, data: { ...fields } }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const body = await req.json();

    const { entity, action, id, data } = body as {
      entity: string;
      action: 'create' | 'update';
      id?: string;
      data: Record<string, unknown>;
    };

    if (!entity || !action || !data) {
      return badRequest('Missing required fields: entity, action, data');
    }

    const config = ENTITY_CONFIG[entity as EntityType];
    if (!config) {
      return badRequest(`Unknown entity: ${entity}. Valid: ${Object.keys(ENTITY_CONFIG).join(', ')}`);
    }

    if (action === 'update' && !id && entity !== 'memory') {
      return badRequest('id is required for update action');
    }

    const schema = action === 'create' ? config.createSchema : config.updateSchema;
    const parsed = schema.safeParse(data);
    if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten());

    let result;
    if (action === 'create') {
      result = await config.create(auth, slug, parsed.data);
    } else {
      result = await config.update(auth, slug, id!, parsed.data);
    }

    if (!result) return notFound('Project or entity');

    return action === 'create' ? created(result) : ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
