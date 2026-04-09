'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineItem } from './timeline-item';

const ActivitiesNewProduct = () => {
  return (
    <TimelineItem icon={Users} line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-foreground">
          Jenny sent an{' '}
          <Button mode="link" asChild>
            <Link href="#">inquiry</Link>
          </Button>{' '}
          about a{' '}
          <Button mode="link" asChild>
            <Link href="#">new product</Link>
          </Button>{' '}
          .
        </div>
        <span className="text-xs text-secondary-foreground">
          Today, 9:00 AM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesNewProduct };
