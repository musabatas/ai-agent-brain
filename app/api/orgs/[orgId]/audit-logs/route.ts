import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { orgService } from '@/lib/services/org.service';
import { auditLogService } from '@/lib/services/audit-log.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { orgId } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const result = await auditLogService.list(orgId, {
      actorId: searchParams.get('actorId') ?? undefined,
      entityType: searchParams.get('entityType') ?? undefined,
      action: searchParams.get('action') ?? undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
