'use client';

import { Navbar } from '@/partials/navbar/navbar';
import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';

const PageNavbar = () => {
  const { settings } = useSettings();
  const accountMenuConfig = MENU_SIDEBAR?.['3']?.children;

  if (accountMenuConfig && settings?.layout === 'main') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={accountMenuConfig} />
        </Container>
      </Navbar>
    );
  } else {
    return <></>;
  }
};

export { PageNavbar };
