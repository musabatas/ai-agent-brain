'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useActiveOrgId } from '@/hooks/use-active-org';
import { ContentLoader } from '@/components/common/content-loader';
import { Container } from '@/components/common/container';

export default function OrgLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const orgId = useActiveOrgId();

  if (status === 'loading') {
    return <ContentLoader className="mt-[30%]" />;
  }

  if (!orgId) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">
            No organization associated with your account.
          </p>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
