'use client';

import { Faq } from '@/partials/common/faq';
import { Help } from '@/partials/common/help';
import { CurrentSessions } from '@/app/(protected)/account/security/current-sessions/components/current-sessions';

export function AccountCurrentSessionsContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <CurrentSessions />
      <Faq />
      <Help />
    </div>
  );
}
