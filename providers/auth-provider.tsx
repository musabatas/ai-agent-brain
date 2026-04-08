'use client';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  const basePath =
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NEXT_PUBLIC_BASE_PATH) || '';
  return (
    <SessionProvider session={session} basePath={`${basePath}/api/auth`}>
      {children}
    </SessionProvider>
  );
}
