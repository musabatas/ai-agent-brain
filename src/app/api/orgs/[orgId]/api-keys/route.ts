import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { CreateApiKeySchema } from '@/features/org/schemas/api-key.schema';
import { apiKeyService } from '@/features/org/services/api-key.service';
import { orgService } from '@/features/org/services/org.service';

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

    const keys = await apiKeyService.list(orgId);
    return NextResponse.json({ data: keys });
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
    const role = await orgService.getMemberRole(orgId, user.userId);
    if (!role || role === 'MEMBER') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = CreateApiKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await apiKeyService.create(
      { userId: user.userId, orgId, orgRole: role as 'OWNER' | 'ADMIN' | 'MEMBER', authType: user.authType },
      parsed.data,
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
