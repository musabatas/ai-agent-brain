import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpdateRuleSchema } from '@/features/projects/schemas/rule.schema';
import { ruleService } from '@/features/projects/services/rule.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const rule = await ruleService.get(auth.orgId, slug, id);
    if (!rule) return notFound('Rule');

    return ok(rule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const body = await req.json();
    const parsed = UpdateRuleSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const rule = await ruleService.update(auth, slug, id, parsed.data);
    if (!rule) return notFound('Rule');

    return ok(rule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const rule = await ruleService.delete(auth, slug, id);
    if (!rule) return notFound('Rule');

    return ok(rule);
  } catch (error) {
    return handleApiError(error);
  }
}
