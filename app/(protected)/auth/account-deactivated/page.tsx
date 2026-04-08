'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { AccountDeactivatedDialog } from '@/partials/dialogs/account-deactivated-dialog';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { AccountGetStartedContent } from '@/app/(protected)/account/home/get-started/content';
import { PageNavbar } from '@/app/(protected)/account/page-navbar';

export default function AuthAccountDeactivatedPage() {
  const [profileModalOpen, setProfileModalOpen] = useState(true);
  const handleClose = () => {
    setProfileModalOpen(false);
  };

  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-foreground font-medium">
                  Jayson Tatum
                </span>
                <Link
                  href="mailto:jaytatum@ktstudio.com"
                  className="text-secondary-foreground hover:text-primary"
                >
                  jaytatum@ktstudio.com
                </Link>
                <span className="size-0.75 bg-mono/50 rounded-full"></span>
                <Button mode="link" asChild>
                  <Link href="/account/members/team-info">Personal Info</Link>
                </Button>
              </div>
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container>
        <AccountGetStartedContent />
        <AccountDeactivatedDialog
          open={profileModalOpen}
          onOpenChange={handleClose}
        />
      </Container>
    </Fragment>
  );
}
