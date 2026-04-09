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
    <div className="px-3 py-3 space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="size-7 rounded-md bg-sidebar-foreground/10 flex items-center justify-center shrink-0">
          <span className="font-mono text-xs font-bold text-sidebar-foreground/70">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-sidebar-foreground/40 truncate leading-tight">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/user-management/account"
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5 transition-colors"
        >
          <Settings className="size-3" />
          <span>Account</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/50 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
        >
          <LogOut className="size-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
