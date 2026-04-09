import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { UpdateOrgSchema } from '@/lib/schemas/org.schema';
import { orgService } from '@/lib/services/org.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const { orgId } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 },
      );
    }

    const org = await orgService.get(orgId);
    return NextResponse.json({ data: org });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const { orgId } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = UpdateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const org = await orgService.update(orgId, parsed.data);
    return NextResponse.json({ data: org });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const { orgId } = await params;
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (role !== 'OWNER') {
      return NextResponse.json(
        { message: 'Only the organization owner can delete an organization' },
        { status: 403 },
      );
    }

    await orgService.delete(orgId);
    return NextResponse.json({ message: 'Organization deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
