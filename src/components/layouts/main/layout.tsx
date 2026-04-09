'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';

export function MainLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { settings } = useSettings();
  const sidebarOpen = !settings.layouts.main.sidebarCollapse;

  const sidebarWidth = sidebarOpen ? 260 : 72;

  return (
    <div className="relative w-full min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>

      {!isMobile && <Sidebar />}

      <div
        className="transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: isMobile ? 0 : sidebarWidth }}
      >
        <Header />

        <main
          id="main-content"
          className={cn(
            'bg-background px-4 py-4 lg:px-6 lg:py-5 min-h-[calc(100vh-48px)]',
            isMobile && 'pb-24',
          )}
          role="main"
        >
          <div className="mx-auto w-full">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
