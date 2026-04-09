'use client';

import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Pin, PinOff } from 'lucide-react';
import { SidebarHeader } from './sidebar-header';
import { SidebarNav } from './sidebar-nav';
import { SidebarUser } from './sidebar-user';
import { OrgSwitcher } from './org-switcher';

export function Sidebar() {
  const { settings, storeOption } = useSettings();
  const isPinned = !settings.layouts.main.sidebarCollapse;
  const isOpen = isPinned; // When pinned, always open. When unpinned, controlled by hover.

  const handleMouseEnter = () => {
    if (!isPinned) {
      storeOption('layouts.main.sidebarCollapse', false);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      storeOption('layouts.main.sidebarCollapse', true);
    }
  };

  const togglePin = () => {
    storeOption('layouts.main.sidebarCollapse', !settings.layouts.main.sidebarCollapse);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'hidden lg:flex fixed left-0 top-0 bottom-0 z-40',
        'flex-col overflow-hidden',
        'transition-all duration-200 ease-out',
        isOpen ? 'w-[260px]' : 'w-[72px]',
        'bg-sidebar backdrop-blur-xl',
      )}
    >
      {/* Logo */}
      <SidebarHeader isOpen={isOpen} />

      {/* Org Switcher */}
      {isOpen && (
        <div className="px-2 pb-2 border-b border-sidebar-border">
          <OrgSwitcher />
        </div>
      )}

      {/* Navigation */}
      <SidebarNav isOpen={isOpen} />

      {/* Bottom: User + Pin Toggle */}
      <div className="mt-auto">
        {isOpen && <SidebarUser />}

        {/* Pin toggle */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2',
          'border-t border-sidebar-border',
        )}>
          {isOpen && (
            <span className="text-sidebar-muted flex-1 text-xs font-medium">
              {isPinned ? 'Pinned' : 'Auto-hide'}
            </span>
          )}
          <button
            onClick={togglePin}
            className={cn(
              'flex items-center justify-center',
              'size-7 rounded-md',
              'transition-colors duration-200 ease-out',
              'hover:bg-sidebar-accent',
              isPinned
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-sidebar-muted hover:text-sidebar-foreground',
              !isOpen && 'mx-auto',
            )}
          >
            {isPinned ? (
              <Pin className="size-3.5" />
            ) : (
              <PinOff className="size-3.5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
