'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Layers,
  CheckSquare,
  GitBranch,
  Shield,
  FileText,
  Brain,
  Folder,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const ENTITY_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  feature: {
    icon: <Layers className="size-3.5" />,
    label: 'Feature',
    color: 'text-sky-400',
  },
  task: {
    icon: <CheckSquare className="size-3.5" />,
    label: 'Task',
    color: 'text-emerald-400',
  },
  decision: {
    icon: <GitBranch className="size-3.5" />,
    label: 'Decision',
    color: 'text-amber-400',
  },
  rule: {
    icon: <Shield className="size-3.5" />,
    label: 'Rule',
    color: 'text-red-400',
  },
  document: {
    icon: <FileText className="size-3.5" />,
    label: 'Document',
    color: 'text-violet-400',
  },
  memory: {
    icon: <Brain className="size-3.5" />,
    label: 'Memory',
    color: 'text-zinc-400',
  },
};

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  status?: string;
  priority?: string;
}

export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  const pathname = usePathname();
  const router = useRouter();

  // Extract project slug from URL
  const slugMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectSlug = slugMatch?.[1] ?? null;

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || !projectSlug) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const endpoints = [
      'features',
      'tasks',
      'decisions',
      'rules',
      'documents',
      'memory',
    ];

    Promise.all(
      endpoints.map(async (entity) => {
        try {
          const res = await apiFetch(
            `/api/projects/${projectSlug}/${entity}?search=${encodeURIComponent(debouncedQuery)}&limit=5`,
            { signal: controller.signal },
          );
          if (!res.ok) return [];
          const json = await res.json();
          const items = json.data ?? [];
          const type = entity === 'features'
            ? 'feature'
            : entity === 'tasks'
              ? 'task'
              : entity === 'decisions'
                ? 'decision'
                : entity === 'rules'
                  ? 'rule'
                  : entity === 'documents'
                    ? 'document'
                    : 'memory';

          return items.map((item: any) => ({
            id: item.id,
            type,
            title: item.title ?? item.key ?? 'Untitled',
            subtitle:
              item.description?.slice(0, 80) ??
              item.content?.slice(0, 80) ??
              item.value?.slice(0, 80) ??
              item.context?.slice(0, 80) ??
              undefined,
            status: item.status,
            priority: item.priority,
          }));
        } catch {
          return [];
        }
      }),
    ).then((grouped) => {
      setResults(grouped.flat());
      setLoading(false);
    });

    return () => controller.abort();
  }, [debouncedQuery, projectSlug]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (!projectSlug) return;
      const entityPlural =
        result.type === 'memory'
          ? 'memory'
          : result.type + 's';
      // Deep link: pass item ID as query param so the page auto-opens the detail sheet
      router.push(
        `/projects/${projectSlug}/${entityPlural}?open=${result.id}`,
      );
      setOpen(false);
      setQuery('');
    },
    [projectSlug, router],
  );

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-9 px-3 gap-2 text-muted-foreground/60 hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="text-sm hidden lg:inline">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 h-5 rounded bg-muted/50 border border-border/50 text-[10px] font-mono text-muted-foreground/50">
          ⌘K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0 sm:top-[15%] sm:translate-y-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <DialogDescription className="sr-only">
              Search across project entities
            </DialogDescription>
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  projectSlug
                    ? 'Search features, tasks, decisions, rules, docs, memory...'
                    : 'Navigate to a project first to search'
                }
                className="pl-6 border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:outline-none"
                autoFocus
                disabled={!projectSlug}
              />
            </div>
          </DialogHeader>

          <div className="border-t border-border/40" />

          <DialogBody className="p-0">
            <ScrollArea className="max-h-[400px]">
              {!projectSlug ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                  <Folder className="size-8 mb-3 opacity-30" />
                  <p className="text-sm">Navigate to a project to search</p>
                </div>
              ) : !debouncedQuery || debouncedQuery.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                  <Search className="size-8 mb-3 opacity-30" />
                  <p className="text-sm">Type to search across all entities</p>
                  <p className="text-xs mt-1 text-muted-foreground/30">
                    Features, tasks, decisions, rules, documents, memory
                  </p>
                </div>
              ) : loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                  <Search className="size-8 mb-3 opacity-30" />
                  <p className="text-sm">No results found</p>
                  <p className="text-xs mt-1 text-muted-foreground/30">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(
                    results.reduce(
                      (acc, r) => {
                        (acc[r.type] = acc[r.type] || []).push(r);
                        return acc;
                      },
                      {} as Record<string, SearchResult[]>,
                    ),
                  ).map(([type, items]) => {
                    const config = ENTITY_CONFIG[type];
                    return (
                      <div key={type} className="mb-2">
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <span className={config.color}>{config.icon}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {config.label}s
                          </span>
                          <span className="text-[10px] adb-mono text-muted-foreground/40">
                            {items.length}
                          </span>
                        </div>
                        {items.map((result) => (
                          <button
                            key={result.id}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-3 group"
                            onClick={() => handleSelect(result)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                                {result.title}
                              </p>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground/50 truncate mt-0.5">
                                  {result.subtitle}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                              {result.status && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {result.status.replace('_', ' ')}
                                </Badge>
                              )}
                              {result.priority && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {result.priority}
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
