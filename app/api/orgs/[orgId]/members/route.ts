import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { AddOrgMemberSchema } from '@/lib/schemas/org.schema';
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
    return NextResponse.json({ data: org?.members ?? [] });
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
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const { orgId } = await params;
    const callerRole = await orgService.getMemberRole(orgId, user.userId);
    if (!callerRole || callerRole === 'MEMBER') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = AddOrgMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await orgService.addMember(
      orgId,
      parsed.data.email,
      parsed.data.role,
    );

    if (!result) {
      return NextResponse.json(
        { message: 'User not found with that email.' },
        { status: 404 },
      );
    }

    if ('alreadyMember' in result) {
      return NextResponse.json(
        { message: 'User is already an organization member.' },
        { status: 409 },
      );
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
