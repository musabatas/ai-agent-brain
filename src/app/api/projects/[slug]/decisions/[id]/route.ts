import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpdateDecisionSchema } from '@/features/projects/schemas/decision.schema';
import { decisionService } from '@/features/projects/services/decision.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const decision = await decisionService.get(auth.orgId, slug, id);
    if (!decision) return notFound('Decision');

    return ok(decision);
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
    const parsed = UpdateDecisionSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const decision = await decisionService.update(auth, slug, id, parsed.data);
    if (!decision) return notFound('Decision');

    return ok(decision);
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
    const decision = await decisionService.delete(auth, slug, id);
    if (!decision) return notFound('Decision');

    return ok(decision);
  } catch (error) {
    return handleApiError(error);
  }
}
