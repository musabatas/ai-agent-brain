'use client';

import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/layouts/main/components/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { AccountPlansContent } from '@/app/(protected)/account/billing/plans/content';
import { PageNavbar } from '@/app/(protected)/account/page-navbar';

export default function AccountPlansPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'main' && (
        <Container>
          <Toolbar>
            <ToolbarHeading
              title="Plans"
              description="Central Hub for Personal Customization"
            />
            <ToolbarActions>
              <Button variant="outline">View Billing</Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountPlansContent />
      </Container>
    </Fragment>
  );
}
