'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LogOut, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function SidebarUser() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="px-4 py-3 space-y-2">
      {/* User info */}
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
          <span className="adb-mono text-[11px] font-bold text-muted-foreground">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-tight">
            {user.name || 'User'}
          </p>
          <p className="text-[11px] text-muted-foreground/50 truncate leading-tight">
            {user.email}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1">
        <Link
          href="/user-management/account"
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <Settings className="size-3" />
          <span data-slot="accordion-menu-title">Account</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
        >
          <LogOut className="size-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
