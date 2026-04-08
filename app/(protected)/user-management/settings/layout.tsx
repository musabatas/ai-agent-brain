'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Container } from '@/components/common/container';
import { ContentLoader } from '@/components/common/content-loader';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { SettingsProvider } from './components/settings-context';

type NavRoutes = Record<
  string,
  {
    title: string;
    path: string;
  }
>;

const fetchSettings = async () => {
  const response = await apiFetch('/api/user-management/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data = { settings: null, roles: [] }, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSettings,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { settings, roles } = data;

  const navRoutes = useMemo<NavRoutes>(
    () => ({
      general: {
        title: 'General',
        path: '/user-management/settings',
      },
      notifications: {
        title: 'Notifications',
        path: '/user-management/settings/notifications',
      },
      social: {
        title: 'Social',
        path: '/user-management/settings/social',
      },
    }),
    [],
  );

  // Local state to instantly update the active tab on click
  const [activeTab, setActiveTab] = useState<string>('');

  // Keep the local state in sync with the current pathname, in case navigation happens externally
  useEffect(() => {
    const found = Object.keys(navRoutes).find(
      (key) => pathname === navRoutes[key].path,
    );
    if (found) {
      setActiveTab(found);
    } else {
      setActiveTab('general');
    }
  }, [navRoutes, pathname]);

  // Handle tab click: update local state immediately and trigger navigation
  const handleTabClick = (key: string, path: string) => {
    setActiveTab(key);
    // Navigate after a short delay (or immediately) so that the UI updates first
    router.push(path);
  };

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  return (
    <SettingsProvider settings={settings} roles={roles}>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Settings</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>
      <Container>
        <Tabs defaultValue={activeTab} value={activeTab} className="space-y-5">
          <TabsList variant="line">
            {Object.entries(navRoutes).map(([key, { title, path }]) => (
              <TabsTrigger
                key={key}
                value={key}
                disabled={isLoading}
                onClick={() => handleTabClick(key, path)}
                className="justify-start"
              >
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grow mt-5">{children}</div>
      </Container>
    </SettingsProvider>
  );
}
