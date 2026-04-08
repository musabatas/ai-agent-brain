'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  Bell,
  CloudCog,
  Mail,
  MessageSquare,
  Send,
  Settings,
  Share2,
  ThumbsDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DropdownMenu1({ trigger }: { trigger: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-[175px]" side="bottom" align="end">
        <DropdownMenuItem asChild>
          <Link href="/account/activity">
            <CloudCog />
            <span>Activity</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="#">
            <Share2 />
            <span>Share</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Bell />
            <span>Notifications</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[150px]">
            <DropdownMenuItem asChild>
              <Link href="/account/home/settings-sidebar">
                <Mail />
                <span>Email</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/home/settings-sidebar">
                <MessageSquare />
                <span>SMS</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/home/settings-sidebar">
                <Send />
                <span>Push</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <Link href="#">
            <ThumbsDown />
            <span>Report</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/home/settings-enterprise">
            <Settings />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
