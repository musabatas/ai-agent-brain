'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';

export default function AccountSettingsModalPage() {
  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Account Settings</ToolbarTitle>
        </ToolbarHeading>
      </Toolbar>
      <div className="text-center py-12 text-muted-foreground">
        <p>Account settings page</p>
      </div>
    </Container>
  );
}
