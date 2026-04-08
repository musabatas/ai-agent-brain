'use client';

import { useSession } from 'next-auth/react';
import { useSettings } from '@/providers/settings-provider';

/**
 * Returns the currently active organization ID.
 * Priority: settings.activeOrgId (set by org switcher/onboarding) > session.defaultOrgId
 */
export function useActiveOrgId(): string | null {
  const { data: session } = useSession();
  const { settings } = useSettings();

  const fromSettings = (settings as unknown as Record<string, string>)
    .activeOrgId;
  const fromSession = session?.user?.defaultOrgId;

  return fromSettings || fromSession || null;
}
