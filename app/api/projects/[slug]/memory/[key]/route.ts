import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound } from '@/lib/api-response';
import { memoryService } from '@/lib/services/memory.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, key } = await params;
    const memory = await memoryService.recall(auth.orgId, slug, key);
    if (!memory) return notFound('Memory');

    return ok(memory);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, key } = await params;
    const memory = await memoryService.delete(auth, slug, key);
    if (!memory) return notFound('Memory');

    return ok(memory);
  } catch (error) {
    return handleApiError(error);
  }
}
