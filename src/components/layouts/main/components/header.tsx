'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserDropdownMenu } from '@/components/common/user-dropdown-menu';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Breadcrumb } from './breadcrumb';
import { SidebarNav } from './sidebar-nav';
import { GlobalSearchDialog } from './global-search';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const pathname = usePathname();
  const mobileMode = useIsMobile();

  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-12 items-center',
        'bg-surface-1 backdrop-blur-md',
        'px-4 lg:px-6',
      )}
    >
      {/* Mobile: Logo + Menu */}
      <div className="flex items-center gap-2 lg:hidden">
        <Link href="/dashboard" className="shrink-0">
          <span className="text-sm font-bold text-foreground">ADB</span>
        </Link>
        {mobileMode && (
          <Sheet
            open={isSidebarSheetOpen}
            onOpenChange={setIsSidebarSheetOpen}
          >
            <SheetTrigger asChild>
              <Button variant="ghost" mode="icon" size="sm" aria-label="Open menu">
                <Menu className="text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0 gap-0 w-[275px]" side="left" close={false}>
              <SheetHeader className="p-0 space-y-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <SheetBody className="p-0 overflow-y-auto">
                <SidebarNav isOpen={true} />
              </SheetBody>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Desktop: Breadcrumb */}
      {!mobileMode && <Breadcrumb />}

      {/* Right: Search + User */}
      <div className="flex items-center gap-2 ml-auto">
        <GlobalSearchDialog />
        <UserDropdownMenu
          trigger={
            <img
              className="size-7 rounded-full border border-border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              src={toAbsoluteUrl('/media/avatars/300-2.png')}
              alt="User Avatar"
            />
          }
        />
      </div>
    </header>
  );
}
