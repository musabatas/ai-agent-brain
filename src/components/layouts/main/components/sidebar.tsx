'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { SidebarHeader } from './sidebar-header';
import { SidebarNav } from './sidebar-nav';
import { SidebarUser } from './sidebar-user';
import { OrgSwitcher } from './org-switcher';

export function Sidebar() {
  const { settings } = useSettings();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'sidebar bg-background/80 backdrop-blur-xl lg:border-e lg:border-border/40 lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0',
        (settings.layouts.main.sidebarTheme === 'dark' ||
          pathname.includes('dark-sidebar')) &&
          'dark',
      )}
    >
      <SidebarHeader />

      <div className="overflow-hidden flex flex-col flex-1">
        <div className="w-(--sidebar-default-width) flex flex-col flex-1 min-h-0">
          {/* Org Switcher */}
          <div className="px-4 pb-2">
            <OrgSwitcher />
          </div>

          {/* Separator */}
          <div className="h-px bg-border/30 mx-4" />

          {/* Navigation */}
          <SidebarNav />

          {/* Bottom spacer + user */}
          <div className="mt-auto">
            <div className="h-px bg-border/30 mx-4" />
            <SidebarUser />
          </div>
        </div>
      </div>
    </div>
  );
}
