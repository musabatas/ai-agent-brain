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
  children?: { title: string; path: string }[];
}

interface NavSection {
  label?: string;
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
    items: [
      {
        title: 'Members',
        icon: Users,
        path: '/org/members',
      },
      {
        title: 'API Keys',
        icon: Key,
        path: '/org/api-keys',
      },
      {
        title: 'Settings',
        icon: Settings,
        path: '/org/settings',
      },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(() => {
    // Auto-expand section matching current path
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
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5 scrollbar-none">
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2 mb-2">
              {section.label}
            </p>
          )}

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const hasChildren = !!item.children;
              const isOpen = expanded === item.title;

              if (hasChildren) {
                return (
                  <div key={item.title}>
                    {/* Parent toggle */}
                    <button
                      onClick={() =>
                        setExpanded(isOpen ? null : item.title)
                      }
                      className={cn(
                        'adb-sidebar-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-100 cursor-pointer',
                        active
                          ? 'text-foreground bg-muted/60'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span
                        className="flex-1 text-left"
                        data-slot="accordion-menu-title"
                      >
                        {item.title}
                      </span>
                      <ChevronRight
                        className={cn(
                          'size-3.5 text-muted-foreground/40 transition-transform duration-150',
                          isOpen && 'rotate-90',
                        )}
                        data-slot="accordion-menu-sub-indicator"
                      />
                    </button>

                    {/* Children */}
                    <div
                      className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
                      style={{
                        maxHeight: isOpen ? '300px' : '0px',
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/30 pl-3">
                        {item.children!.map((child) => {
                          const childActive = isChildActive(child.path);
                          return (
                            <Link
                              key={child.path}
                              href={child.path}
                              className={cn(
                                'block px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-100',
                                childActive
                                  ? 'text-foreground font-medium bg-muted/40'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20',
                              )}
                            >
                              {child.title}
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
                    'adb-sidebar-item flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-100',
                    active
                      ? 'text-foreground bg-foreground/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0',
                      active && 'text-foreground',
                    )}
                  />
                  <span data-slot="accordion-menu-title">{item.title}</span>
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-foreground" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
