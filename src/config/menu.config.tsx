import {
  Bell,
  FolderKanban,

  LayoutDashboard,
  Settings,
  ShieldUser,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_ROOT: MenuConfig = [];
export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
export const MENU_SIDEBAR_COMPACT: MenuConfig = [];
export const MENU_SIDEBAR_CUSTOM: MenuConfig = [];
export const MENU_HELP: MenuConfig = [];

export const MENU_SIDEBAR: MenuConfig = [
  {
    heading: 'Main',
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    title: 'Projects',
    icon: FolderKanban,
    path: '/projects',
    rootPath: '/projects',
  },
  {
    heading: 'Management',
  },
  {
    title: 'Organization',
    icon: Users,
    children: [
      {
        title: 'Members',
        path: '/org/members',
      },
      {
        title: 'API Keys',
        path: '/org/api-keys',
      },
      {
        title: 'Settings',
        path: '/org/settings',
      },
    ],
  },
  {
    title: 'User Management',
    icon: ShieldUser,
    children: [
      {
        title: 'Users',
        path: '/user-management/users',
      },
      {
        title: 'Roles',
        path: '/user-management/roles',
      },
      {
        title: 'Permissions',
        path: '/user-management/permissions',
      },
    ],
  },
  {
    separator: true,
  },
  {
    title: 'Notifications',
    icon: Bell,
    path: '/user-management/account/notifications',
  },
  {
    title: 'Account',
    icon: Settings,
    path: '/user-management/account',
  },
];
