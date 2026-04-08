'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AudioLines, ShieldCheck, UserPen } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Container } from '@/components/common/container';
import { ContentLoader } from '@/components/common/content-loader';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { AccountProvider } from './components/account-context';

type NavRoutes = Record<
  string,
  {
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    path: string;
  }
>;

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ['account-profile'],
    queryFn: async () => {
      const response = await apiFetch('/api/user-management/account/');
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const navRoutes = useMemo<NavRoutes>(
    () => ({
      profile: {
        title: 'Profile',
        icon: UserPen,
        path: '/user-management/account',
      },
      security: {
        title: 'Security',
        icon: ShieldCheck,
        path: '/user-management/account/security',
      },
      logs: {
        title: 'Logs',
        icon: AudioLines,
        path: '/user-management/account/logs',
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
      setActiveTab('profile');
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
    <AccountProvider user={user}>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Account</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="space-y-7 lg:w-[200px] shrink-0 pt-6">
            <div className="flex items-center gap-2.5">
              <Avatar key={user.avatar} className="size-12">
                {user.avatar && (
                  <AvatarImage src={user.avatar} alt={user.name || ''} />
                )}
                <AvatarFallback className="text-lg">
                  {getInitials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-px">
                <div className="font-semibold text-sm">{user.name}</div>
                <div className="text-muted-foreground text-2sm">
                  {user.role.name}
                </div>
              </div>
            </div>
            <Tabs defaultValue={activeTab} value={activeTab}>
              <TabsList
                variant="button"
                className="flex flex-col items-stretch gap-3.5 border-0"
              >
                {Object.entries(navRoutes).map(
                  ([key, { title, icon: Icon, path }]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      disabled={isLoading}
                      onClick={() => handleTabClick(key, path)}
                      className="justify-start"
                    >
                      <Icon />
                      <span>{title}</span>
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </Tabs>
          </div>
          <div className="grow">{children}</div>
        </div>
      </Container>
    </AccountProvider>
  );
}
