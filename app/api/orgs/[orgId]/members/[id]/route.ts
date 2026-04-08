import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { UpdateOrgMemberSchema } from '@/lib/schemas/org.schema';
import { orgService } from '@/lib/services/org.service';

export async function PATCH(
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
    const callerRole = await orgService.getMemberRole(orgId, user.userId);
    if (callerRole !== 'OWNER') {
      return NextResponse.json(
        { message: 'Only the owner can change member roles' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = UpdateOrgMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await orgService.updateMemberRole(
      orgId,
      id,
      parsed.data.role,
    );
    if (!result) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 },
      );
    }

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
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const { orgId, id } = await params;
    const callerRole = await orgService.getMemberRole(orgId, user.userId);
    if (!callerRole || callerRole === 'MEMBER') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 },
      );
    }

    const result = await orgService.removeMember(orgId, id);
    if (!result) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 },
      );
    }
    if ('isOwner' in result) {
      return NextResponse.json(
        { message: 'Cannot remove the organization owner' },
        { status: 403 },
      );
    }

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    return handleApiError(error);
  }
}
