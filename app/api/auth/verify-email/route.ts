import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Token is missing' }, { status: 400 });
  }

  // First, retrieve the verification token.
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 400 },
    );
  }

  try {
    // Use a transaction so that the user update and token deletion occur together.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: verificationToken.identifier },
        data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
      });

      await tx.verificationToken.deleteMany({
        where: { token },
      });
    });

    return NextResponse.json(
      { message: 'Email verified successfully!' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
