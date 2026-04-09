import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handleApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    // Fetch the user based on the email in the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: true,
      },
    });

    // Check if record exists
    if (!user) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
