import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { commentService } from '@/features/projects/services/comment.service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { slug, id } = await params;
    const result = await commentService.delete(auth, slug, id);

    if (!result) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    if ('forbidden' in result) return NextResponse.json({ message: 'Cannot delete this comment' }, { status: 403 });

    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
