'use client';

import { Button } from '@/components/ui/button';

const MegaMenuFooter = () => {
  return (
    <div className="flex flex-wrap items-center lg:justify-between rounded-xl lg:rounded-t-none border border-border lg:border-0 lg:border-t lg:border-t-border px-4 py-4 lg:px-7.5 lg:py-5 gap-2.5 bg-muted/50">
      <div className="flex flex-col gap-1.5">
        <div className="text-base font-semibold text-mono leading-none">
          Read to Get Started ?
        </div>
        <div className="text-sm fomt-medium text-secondary-foreground">
          Take your docs to the next level
        </div>
      </div>
      <Button variant="mono" asChild>
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read Documentation
        </a>
      </Button>
    </div>
  );
};

export { MegaMenuFooter };
