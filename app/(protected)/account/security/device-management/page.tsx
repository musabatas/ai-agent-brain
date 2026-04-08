'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/(protected)/account/page-navbar';
import { AccountDeviceManagementContent } from '@/app/(protected)/account/security/device-management/content';

export default function AccountDeviceManagementPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'main' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <span className="text-sm text-secondary-foreground">
                  Authorized Devices for Report Access
                </span>
                <span className="size-0.75 bg-mono/50 rounded-full"></span>
                <Button mode="link" underlined="dashed" asChild>
                  <Link href="#">Unlink All Devices</Link>
                </Button>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">Security Overview</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountDeviceManagementContent />
      </Container>
    </Fragment>
  );
}
