import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { orgService } from '@/features/org/services/org.service';
import { webhookService } from '@/features/webhooks/services/webhook.service';
import { z } from 'zod';

const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

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

    const webhooks = await webhookService.list(orgId);
    return NextResponse.json({ data: webhooks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { orgId } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = CreateWebhookSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });

    const webhook = await webhookService.create(orgId, parsed.data);
    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
