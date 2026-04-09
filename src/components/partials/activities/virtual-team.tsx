'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineItem } from './timeline-item';

const ActivitiesVirtualTeam = () => {
  return (
    <TimelineItem icon={BadgeCheck} line={false}>
      <div className="flex flex-col">
        <div className="text-sm font-medium text-foreground">
          Hosted a virtual{' '}
          <Button mode="link" asChild>
            <Link href="/public-profile/profiles/creator">
              team-building event
            </Link>
          </Button>
          , fostering collaboration and strengthening bonds among team members.
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          1 month ago, 13:56 PM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesVirtualTeam };
