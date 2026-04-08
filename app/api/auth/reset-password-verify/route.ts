// /api/auth/verify-reset-token.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  // Validate the input
  if (!token) {
    return NextResponse.json(
      { message: 'Token is required.' },
      { status: 400 },
    );
  }

  try {
    // Check if the token exists and is not expired
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: 'Invalid or expired token.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: 'Token is valid.' }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Token verification failed.' },
      { status: 500 },
    );
  }
}
