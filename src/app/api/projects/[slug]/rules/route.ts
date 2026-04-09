import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { created, unauthorized, badRequest } from '@/lib/api-response';
import { CreateRuleSchema } from '@/features/projects/schemas/rule.schema';
import { ruleService } from '@/features/projects/services/rule.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') ?? undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive =
      isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
    const search = searchParams.get('search') ?? undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const result = await ruleService.list(auth.orgId, slug, { scope, isActive, search, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const body = await req.json();
    const parsed = CreateRuleSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const rule = await ruleService.create(auth, slug, parsed.data);
    return created(rule);
  } catch (error) {
    return handleApiError(error);
  }
}
