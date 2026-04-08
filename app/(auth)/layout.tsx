'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ScreenLoader } from '@/components/common/screen-loader';
import { BrandedLayout } from './layouts/branded';

export default function Layout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return <ScreenLoader />;
  }

  return <BrandedLayout>{children}</BrandedLayout>;
}
