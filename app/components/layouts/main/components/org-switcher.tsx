'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  FolderKanban,
  Plus,
  Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useSettings } from '@/providers/settings-provider';

interface Org {
  id: string;
  name: string;
  slug: string;
  memberRole: string;
  memberCount: number;
  projectCount: number;
}

const roleColors: Record<string, string> = {
  OWNER: 'text-amber-400 bg-amber-500/10',
  ADMIN: 'text-sky-400 bg-sky-500/10',
  MEMBER: 'text-zinc-400 bg-zinc-500/10',
};

export function OrgSwitcher() {
  const { data: session } = useSession();
  const { settings, storeOption } = useSettings();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOrgId =
    (settings as unknown as Record<string, string>).activeOrgId ||
    session?.user?.defaultOrgId;

  const { data } = useQuery({
    queryKey: ['user-orgs'],
    queryFn: async () => {
      const res = await apiFetch('/api/orgs');
      if (!res.ok) throw new Error('Failed to load organizations');
      const json = await res.json();
      return json.data as Org[];
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const orgs: Org[] = data ?? [];
  const activeOrg = orgs.find((o) => o.id === activeOrgId) || orgs[0];

  useEffect(() => {
    if (orgs.length > 0 && !activeOrgId) {
      storeOption('activeOrgId', orgs[0].id);
    }
  }, [orgs, activeOrgId, storeOption]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSwitch = (orgId: string) => {
    storeOption('activeOrgId', orgId);
    setOpen(false);
    window.location.reload();
  };

  if (orgs.length === 0) return null;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div ref={containerRef}>
      {/* Trigger — Active Org */}
      <button
        onClick={() => setOpen(!open)}
        className="adb-org-trigger w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl border border-border/60 bg-muted/30 transition-colors duration-150 hover:border-foreground/20 hover:bg-muted/50 group cursor-pointer"
      >
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'oklch(50% 0 0 / 0.08)' }}
        >
          <span className="adb-mono text-[11px] font-bold text-foreground">
            {getInitials(activeOrg?.name || 'O')}
          </span>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {activeOrg?.name || 'Select org'}
          </p>
          <p className="text-[10px] text-muted-foreground/60 leading-tight capitalize">
            {activeOrg?.memberRole?.toLowerCase() || 'member'}
          </p>
        </div>

        <ChevronDown
          className={`size-3.5 text-muted-foreground/40 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Inline Expanding Panel */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
        style={{
          maxHeight: open ? '400px' : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="pt-1 pb-0.5 mt-1 rounded-xl bg-background border border-border/40 shadow-sm">
          {/* Thin separator */}
          <div className="h-px bg-border/40 mx-2 mb-1.5" />

          {/* Org list */}
          <div className="space-y-0.5">
            {orgs.map((org) => {
              const isActive = org.id === activeOrg?.id;
              const rc = roleColors[org.memberRole] || roleColors.MEMBER;

              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors duration-100 cursor-pointer ${
                    isActive ? 'bg-muted/60' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Mini avatar */}
                  <div
                    className={`size-7 rounded-md flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-foreground/8' : 'bg-muted/80'
                    }`}
                  >
                    <span
                      className={`adb-mono text-[10px] font-bold ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground/70'
                      }`}
                    >
                      {getInitials(org.name)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[13px] font-medium truncate ${
                          isActive ? 'text-foreground' : 'text-foreground/80'
                        }`}
                      >
                        {org.name}
                      </span>
                      {isActive && (
                        <Check className="size-3 text-foreground shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                        <Users className="size-2.5" />
                        <span className="adb-mono">{org.memberCount}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                        <FolderKanban className="size-2.5" />
                        <span className="adb-mono">{org.projectCount}</span>
                      </span>
                      <span
                        className={`text-[9px] px-1 py-px rounded font-medium ${rc}`}
                      >
                        {org.memberRole?.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Separator + Create */}
          <div className="h-px bg-border/40 mx-2 my-1.5" />

          <button
            onClick={() => {
              setOpen(false);
              router.push('/org/new');
            }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors duration-100 cursor-pointer"
          >
            <div className="size-7 rounded-md border border-dashed border-border/50 flex items-center justify-center shrink-0">
              <Plus className="size-3.5" />
            </div>
            <span className="text-[13px] font-medium">New Organization</span>
          </button>
        </div>
      </div>
    </div>
  );
}
