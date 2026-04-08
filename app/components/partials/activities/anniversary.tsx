'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineItem } from './timeline-item';

const ActivitiesAnniversary = () => {
  return (
    <TimelineItem icon={Trophy} line={false} removeSpace={true}>
      <div className="flex flex-col">
        <div className="text-sm text-foreground">
          We recently{' '}
          <Button mode="link" asChild>
            <Link href="/public-profile/profiles/nft">celebrated</Link>
          </Button>{' '}
          the blog's 1-year anniversary
        </div>
        <span className="text-xs text-secondary-foreground">
          3 months ago, 4:07 PM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesAnniversary };
