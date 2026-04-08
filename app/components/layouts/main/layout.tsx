'use client';

import { ReactNode, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';

export function MainLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { settings, setOption } = useSettings();

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (settings.layouts.main.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [settings]);

  useEffect(() => {
    setOption('layout', 'main');
  }, [setOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    bodyClass.add('main-layout');
    bodyClass.add('sidebar-fixed');
    bodyClass.add('header-fixed');

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000);

    return () => {
      bodyClass.remove('main-layout');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {!isMobile && <Sidebar />}

      <div className="wrapper flex grow flex-col">
        <Header />

        <main className="grow pt-5" role="content">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}

export default MainLayout;
