'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useViewport } from '@/hooks/use-viewport';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scrollspy } from '@/components/ui/scrollspy';
import { AccountSettingsSidebar } from '@/app/(protected)/account/home/settings-sidebar/account-basic-sidebar';
import { AdvancedSettingsAddress } from '@/app/(protected)/account/home/settings-sidebar/components/advanced-settings-address';
import { AdvancedSettingsAppearance } from '@/app/(protected)/account/home/settings-sidebar/components/advanced-settings-appearance';
import { AdvancedSettingsNotifications } from '@/app/(protected)/account/home/settings-sidebar/components/advanced-settings-notifications';
import { AdvancedSettingsPreferences } from '@/app/(protected)/account/home/settings-sidebar/components/advanced-settings-preferences';
import { AuthEmail } from '@/app/(protected)/account/home/settings-sidebar/components/auth-email';
import { AuthPassword } from '@/app/(protected)/account/home/settings-sidebar/components/auth-password';
import { AuthSingleSingOn } from '@/app/(protected)/account/home/settings-sidebar/components/auth-single-sing-on';
import { AuthSocialSignIn } from '@/app/(protected)/account/home/settings-sidebar/components/auth-social-sign-in';
import { AuthTwoFactor } from '@/app/(protected)/account/home/settings-sidebar/components/auth-two-factor';
import { BasicSettings } from '@/app/(protected)/account/home/settings-sidebar/components/basic-settings';
import { DeleteAccount } from '@/app/(protected)/account/home/settings-sidebar/components/delete-account';
import { ExternalServicesIntegrations } from '@/app/(protected)/account/home/settings-sidebar/components/external-services-integrations';
import { ExternalServicesManageApi } from '@/app/(protected)/account/home/settings-sidebar/components/external-services-manage-api';

interface IModalProfileProps {
  open: boolean;
  onOpenChange: () => void;
}

export function AccountSettingsModal({
  open,
  onOpenChange,
}: IModalProfileProps) {
  const mobileMode = useIsMobile();
  const navBar = useRef<any | null>(null);
  const parentRef = useRef<any | null>(null);
  const [sidebarHeight, setSidebarHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const offset = 260;

  useEffect(() => {
    setSidebarHeight(viewportHeight - offset);
  }, [viewportHeight]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="mx-auto grow w-full max-w-[1320px] flex flex-col px-10 gap-0 overflow-hidden [&>button]:hidden"
        variant="fullscreen"
      >
        <DialogHeader className="p-0 border-0">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <div className="flex items-center justify-between flex-wrap grow gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-semibold leading-none text-mono">
                Settings - Modal
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Dynamic, Focused Adjustment Interface
              </div>
            </div>
            <Button onClick={onOpenChange} variant="outline">
              Close
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea
          className="grow py-0 mb-5 ps-0 pe-3 -me-7"
          viewportRef={parentRef}
        >
          <div className="flex grow gap-5 lg:gap-7.5">
            {!mobileMode && (
              <div
                className="w-[300px] sticky top-[1px]"
                style={{ maxHeight: `${sidebarHeight}px` }}
              >
                <ScrollArea viewportRef={navBar} className="h-full">
                  <Scrollspy offset={100} targetRef={parentRef}>
                    <AccountSettingsSidebar />
                  </Scrollspy>
                </ScrollArea>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
