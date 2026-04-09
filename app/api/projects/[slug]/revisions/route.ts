import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { revisionService } from '@/lib/services/revision.service';

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
    const version = searchParams.get('version');

    if (!entityType || !entityId) {
      return NextResponse.json({ message: 'entityType and entityId are required' }, { status: 400 });
    }

    if (version) {
      const revision = await revisionService.get(auth.orgId, slug, entityType, entityId, parseInt(version, 10));
      if (!revision) return NextResponse.json({ message: 'Revision not found' }, { status: 404 });
      return NextResponse.json({ data: revision });
    }

    const revisions = await revisionService.list(auth.orgId, slug, entityType, entityId);
    if (!revisions) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

    return NextResponse.json({ data: revisions });
  } catch (error) {
    return handleApiError(error);
  }
}
