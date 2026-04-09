'use client';

import { useSession } from 'next-auth/react';
import { useSettings } from '@/providers/settings-provider';

/**
 * Returns the currently active organization ID.
 * Priority: settings.activeOrgId > session.defaultOrgId > cookie fallback
 */
export function useActiveOrgId(): string | null {
  const { data: session } = useSession();
  const { settings } = useSettings();

  const fromSettings = (settings as unknown as Record<string, string>)
    .activeOrgId;
  const fromSession = session?.user?.defaultOrgId;

  // Cookie fallback — covers the gap between onboarding setting the cookie
  // and the settings provider picking it up
  let fromCookie: string | undefined;
  if (typeof document !== 'undefined' && !fromSettings && !fromSession) {
    fromCookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith('adb-org-id='))
      ?.split('=')[1];
  }

  return fromSettings || fromSession || fromCookie || null;
}
