import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound } from '@/lib/api-response';
import { contextService } from '@/features/projects/services/context.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const result = await contextService.focus(auth.orgId, slug);
    if (!result) return notFound('Project');

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
