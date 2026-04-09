'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { getInitials } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User } from '@/app/models/user';

interface UserProfileProps {
  user: User;
  isLoading: boolean;
}

const UserHero = ({ user, isLoading }: UserProfileProps) => {
  const Loading = () => {
    return (
      <div className="flex items-center gap-5 mb-5">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    );
  };

  const Content = () => {
    const { copyToClipboard } = useCopyToClipboard();
    const [showCopied, setShowCopied] = useState(false);

    const handleUserIdCopy = () => {
      copyToClipboard(user.id);
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    };

    return (
      <div className="flex items-center gap-5 mb-5">
        <Avatar className="h-14 w-14">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name || ''} />
          ) : (
            <AvatarFallback className="text-xl">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-px">
          <div className="font-medium text-base">{user.name}</div>
          <div className="text-muted-foreground text-sm">{user.email}</div>
          <div>
            <TooltipProvider>
              <Tooltip delayDuration={50}>
                <TooltipTrigger className="cursor-pointer">
                  <Badge
                    variant="secondary"
                    className="gap-1.5 px-2 py-0.5"
                    onClick={handleUserIdCopy}
                  >
                    <span>User ID: {user.id}</span>
                    {showCopied && <Check className="text-success size-3" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Click to copy
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };

  return isLoading || !user ? <Loading /> : <Content />;
};

export default UserHero;
