'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useSettings } from '@/providers/settings-provider';
import { Scrollspy } from '@/components/ui/scrollspy';
import { AccountSettingsSidebar } from '@/app/(protected)/account/home/settings-sidebar/account-basic-sidebar';
import {
  AdvancedSettingsAddress,
  AdvancedSettingsAppearance,
  AdvancedSettingsNotifications,
  AdvancedSettingsPreferences,
  AuthEmail,
  AuthPassword,
  AuthSingleSingOn,
  AuthSocialSignIn,
  AuthTwoFactor,
  BasicSettings,
  DeleteAccount,
  ExternalServicesIntegrations,
  ExternalServicesManageApi,
} from './components';

const stickySidebarClasses: Record<string, string> = {
  'main-layout': 'top-[calc(var(--header-height)+1rem)]',
};

export function AccountSettingsSidebarContent() {
  const isMobile = useIsMobile();
  const { settings } = useSettings();
  const [sidebarSticky, setSidebarSticky] = useState(false);

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document); // Default to document
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  // Effect to update parentRef after the component mounts
  useEffect(() => {
    const scrollableElement = document.getElementById('scrollable_content');
    if (scrollableElement) {
      parentRef.current = scrollableElement;
    }
  }, []); // Run only once on component mount

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  // Get the sticky class based on the current layout, provide a default if not found
  const stickyClass = settings?.layout
    ? stickySidebarClasses[settings?.layout] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  return (
    <div className="flex grow gap-5 lg:gap-7.5">
      {!isMobile && (
        <div className="w-[230px] shrink-0">
          <div
            className={cn(
              'w-[230px]',
              sidebarSticky && `fixed z-10 start-auto ${stickyClass}`,
            )}
          >
            <Scrollspy offset={100} targetRef={parentRef}>
              <AccountSettingsSidebar />
            </Scrollspy>
          </div>
        </div>
      )}
      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
        <BasicSettings />
        <AuthEmail />
        <AuthPassword />
        <AuthSocialSignIn />
        <AuthSingleSingOn />
        <AuthTwoFactor />
        <AdvancedSettingsPreferences />
        <AdvancedSettingsAppearance title={''} />
        <AdvancedSettingsNotifications />
        <AdvancedSettingsAddress />
        <ExternalServicesManageApi title={''} switch={false} />
        <ExternalServicesIntegrations />
        <DeleteAccount />
      </div>
    </div>
  );
}
