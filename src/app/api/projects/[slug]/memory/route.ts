import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpsertMemorySchema } from '@/features/projects/schemas/memory.schema';
import { memoryService } from '@/features/projects/services/memory.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;
    const result = await memoryService.list(auth.orgId, slug, { type, search, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const body = await req.json();
    const parsed = UpsertMemorySchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const memory = await memoryService.upsert(auth, slug, parsed.data);
    if (!memory) return notFound('Project');

    return ok(memory);
  } catch (error) {
    return handleApiError(error);
  }
}
