'use client';

import Link from 'next/link';
import { Brain, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();
  const collapsed = settings.layouts.main.sidebarCollapse;

  const handleToggle = () => {
    storeOption('layouts.main.sidebarCollapse', !collapsed);
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center justify-between shrink-0 h-(--header-height) px-5">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div
          className="size-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'oklch(50% 0 0 / 0.08)' }}
        >
          <Brain className="size-4.5 text-foreground" />
        </div>
        <span className="default-logo text-sm font-bold text-foreground tracking-tight whitespace-nowrap">
          AI Dev Brain
        </span>
      </Link>

      <button
        onClick={handleToggle}
        className="size-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
      >
        {collapsed ? (
          <PanelLeft className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>
    </div>
  );
}
