import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { orgService } from '@/lib/services/org.service';
import { webhookService } from '@/lib/services/webhook.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { orgId, id } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const result = await webhookService.update(orgId, id, body);
    if (!result) return NextResponse.json({ message: 'Webhook not found' }, { status: 404 });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { orgId, id } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const result = await webhookService.delete(orgId, id);
    if (!result) return NextResponse.json({ message: 'Webhook not found' }, { status: 404 });

    return NextResponse.json({ message: 'Webhook deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
