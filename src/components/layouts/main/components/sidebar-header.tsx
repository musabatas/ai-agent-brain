'use client';

import Link from 'next/link';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarHeader({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={cn('flex h-12 shrink-0 items-center', isOpen ? 'px-4' : 'px-2')}>
      <Link
        href="/dashboard"
        className={cn(
          'group flex w-full items-center',
          isOpen ? 'gap-2.5' : 'justify-center',
        )}
      >
        <div className="size-7 rounded-md bg-sidebar-foreground flex items-center justify-center shrink-0">
          <Brain className="size-3.5 text-sidebar" />
        </div>
        {isOpen && (
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight whitespace-nowrap">
            AI Dev Brain
          </span>
        )}
      </Link>
    </div>
  );
}
