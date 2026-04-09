import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { CreateOrgSchema } from '@/features/org/schemas/org.schema';
import { orgService } from '@/features/org/services/org.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const orgs = await orgService.list(user.userId);
    return NextResponse.json({ data: orgs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = CreateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const org = await orgService.create(user.userId, parsed.data);
    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
