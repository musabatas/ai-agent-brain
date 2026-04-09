'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  FolderKanban,
  Key,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  icon: LucideIcon;
  path?: string;
  rootPath?: string;
  children?: { title: string; path: string; icon?: LucideIcon }[];
}

interface NavSection {
  label?: string;
  id?: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      {
        title: 'Projects',
        icon: FolderKanban,
        path: '/projects',
        rootPath: '/projects',
      },
    ],
  },
  {
    label: 'Organization',
    id: 'org',
    items: [
      { title: 'Members', icon: Users, path: '/org/members' },
      { title: 'API Keys', icon: Key, path: '/org/api-keys' },
      { title: 'Settings', icon: Settings, path: '/org/settings' },
    ],
  },
];

export function SidebarNav({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children?.some((c) => pathname.startsWith(c.path))) {
          return item.title;
        }
      }
    }
    return null;
  });

  const isActive = (item: NavItem) => {
    if (item.path === '/' && pathname === '/') return true;
    if (item.path && item.path !== '/' && pathname.startsWith(item.path))
      return true;
    if (item.rootPath && pathname.startsWith(item.rootPath)) return true;
    return false;
  };

  const isChildActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className={cn('flex-1 overflow-y-auto py-3 scrollbar-none', isOpen ? 'px-2' : 'px-2')}>
      <div className="flex flex-col gap-0.5">
        {sections.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            {section.label && isOpen && (
              <div className="mt-5 mb-1.5 px-2.5">
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-sidebar-muted">
                  {section.label}
                </span>
              </div>
            )}

            {/* Divider for collapsed sections */}
            {section.label && !isOpen && (
              <div className="mx-2 my-2 h-px bg-sidebar-border" />
            )}

            {section.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const hasChildren = !!item.children;
              const isItemOpen = expanded === item.title;

              /* Collapsed: icon only */
              if (!isOpen) {
                return (
                  <Link
                    key={item.path || item.title}
                    href={item.path || '#'}
                    className={cn(
                      'flex items-center justify-center',
                      'mx-auto size-9 rounded-md',
                      'transition-colors duration-150 ease-out',
                      active
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
                    )}
                  >
                    <Icon className="size-4" />
                  </Link>
                );
              }

              /* Expanded: full items */
              if (hasChildren) {
                return (
                  <div key={item.title}>
                    <button
                      onClick={() =>
                        setExpanded(isItemOpen ? null : item.title)
                      }
                      className={cn(
                        'group flex w-full items-center gap-2.5',
                        'rounded-md px-2.5 py-1.5',
                        'text-sm font-medium',
                        'transition-colors duration-150 ease-out',
                        'hover:bg-sidebar-accent',
                        active
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-sidebar-muted',
                        'cursor-pointer',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          'size-3.5 text-sidebar-muted/50 transition-transform duration-200 ease-out',
                          isItemOpen && 'rotate-90',
                        )}
                      />
                    </button>

                    <div
                      className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
                      style={{
                        maxHeight: isItemOpen ? '300px' : '0px',
                        opacity: isItemOpen ? 1 : 0,
                      }}
                    >
                      <div className="mt-0.5 ml-6 flex flex-col gap-0.5">
                        {item.children!.map((child) => {
                          const childActive = isChildActive(child.path);
                          return (
                            <Link
                              key={child.path}
                              href={child.path}
                              className={cn(
                                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5',
                                'text-sm font-medium transition-colors duration-150 ease-out',
                                childActive
                                  ? 'bg-sidebar-accent text-sidebar-foreground font-semibold'
                                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
                              )}
                            >
                              <span className="truncate">{child.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  href={item.path!}
                  className={cn(
                    'group flex items-center gap-2.5',
                    'rounded-md px-2.5 py-1.5',
                    'text-sm font-medium',
                    'transition-colors duration-150 ease-out',
                    active
                      ? 'bg-sidebar-accent text-sidebar-foreground font-semibold'
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
