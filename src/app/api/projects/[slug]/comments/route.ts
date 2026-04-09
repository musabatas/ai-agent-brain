import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { commentService } from '@/lib/services/comment.service';
import { z } from 'zod';

const CreateCommentSchema = z.object({
  entityType: z.enum(['feature', 'task', 'decision', 'rule', 'document']),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ message: 'entityType and entityId are required' }, { status: 400 });
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const result = await commentService.list(auth.orgId, slug, entityType, entityId, { limit, offset });
    if (!result) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

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
    if (!auth) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { slug } = await params;
    const body = await req.json();
    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const comment = await commentService.create(auth, slug, parsed.data);
    if (!comment) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
