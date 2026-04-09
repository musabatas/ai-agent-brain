import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { apiKeyService } from '@/lib/services/api-key.service';
import { orgService } from '@/lib/services/org.service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const { orgId, id } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 },
      );
    }

    const result = await apiKeyService.revoke(orgId, id);
    if (!result) {
      return NextResponse.json(
        { message: 'API key not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: 'API key revoked' });
  } catch (error) {
    return handleApiError(error);
  }
}
