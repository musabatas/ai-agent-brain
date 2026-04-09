'use client';

import { use, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Brain,
  Database,
  Link2,
  MessageSquare,
  Search,
  User,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { z } from 'zod';
import { useEntityMutation } from '@/hooks/use-entity-mutation';
import { useInfiniteEntityQuery } from '@/hooks/use-infinite-entity-query';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  MarkdownEditor,
  MarkdownPreview,
} from '@/components/common/markdown-editor';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { MemoryFormDialog } from '@/features/projects/components/memory-form-dialog';

const typeConfig: Record<
  string,
  { icon: React.ReactNode; dot: string; label: string }
> = {
  USER: {
    icon: <User className="size-3.5" />,
    dot: 'bg-sky-400',
    label: 'User',
  },
  FEEDBACK: {
    icon: <MessageSquare className="size-3.5" />,
    dot: 'bg-amber-400',
    label: 'Feedback',
  },
  PROJECT: {
    icon: <Database className="size-3.5" />,
    dot: 'bg-emerald-400',
    label: 'Project',
  },
  REFERENCE: {
    icon: <Link2 className="size-3.5" />,
    dot: 'bg-violet-400',
    label: 'Reference',
  },
};

interface Memory {
  id: string;
  key: string;
  value: string;
  type: string;
  tags: string[];
  expiresAt: string | null;
  updatedAt: string;
}

const editSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().min(1),
  type: z.enum(['USER', 'FEEDBACK', 'PROJECT', 'REFERENCE']),
  tags: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function MemoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMem, setSelectedMem] = useState<Memory | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteEntityQuery<Memory>({
      queryKey: ['project-memory', slug, debouncedSearch, typeFilter],
      endpoint: `/api/projects/${slug}/memory`,
      params: { search: debouncedSearch, type: typeFilter },
      limit: 100,
    });

  const sentinelRef = useIntersectionObserver(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage,
  });

  const memories = data?.pages.flatMap((p) => p.data) ?? [];

  const openId = searchParams.get('open');
  useEffect(() => {
    if (openId && memories.length > 0 && !selectedMem) {
      const match = memories.find((m) => m.id === openId);
      if (match) setSelectedMem(match);
    }
  }, [openId, memories, selectedMem]);

  const grouped = memories.reduce(
    (acc, m) => {
      (acc[m.type] = acc[m.type] || []).push(m);
      return acc;
    },
    {} as Record<string, Memory[]>,
  );

  // Edit form — memory uses PUT (upsert)
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const updateMutation = useEntityMutation({
    method: 'PUT',
    endpoint: `/api/projects/${slug}/memory`,
    invalidateKeys: [['project-memory', slug]],
    successMessage: 'Memory updated',
    onSuccess: () => {
      setEditMode(false);
      if (selectedMem) {
        const vals = editForm.getValues();
        setSelectedMem({
          ...selectedMem,
          ...vals,
          tags: vals.tags
            ? vals.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : selectedMem.tags,
        });
      }
    },
  });

  const deleteMutation = useEntityMutation({
    method: 'DELETE',
    endpoint: `/api/projects/${slug}/memory/${encodeURIComponent(deleteTarget?.key ?? '')}`,
    invalidateKeys: [['project-memory', slug]],
    successMessage: 'Memory deleted',
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedMem(null);
    },
  });

  const handleEdit = () => {
    if (!selectedMem) return;
    editForm.reset({
      key: selectedMem.key,
      value: selectedMem.value,
      type: selectedMem.type as EditValues['type'],
      tags: selectedMem.tags.join(', '),
    });
    setEditMode(true);
  };

  const onEditSubmit = (values: EditValues) => {
    const { tags, ...rest } = values;
    updateMutation.mutate({
      ...rest,
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            placeholder="Search memory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="FEEDBACK">Feedback</SelectItem>
            <SelectItem value="PROJECT">Project</SelectItem>
            <SelectItem value="REFERENCE">Reference</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-4 mr-1" />
          New Memory
        </Button>
      </div>

      {memories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <Brain className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No memory entries found</p>
          <p className="text-xs mt-1 text-muted-foreground/30">
            {debouncedSearch || typeFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Store context and knowledge for your AI agents'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, entries]) => {
            const tc = typeConfig[type] ?? {
              icon: <Brain className="size-3.5" />,
              dot: 'bg-zinc-400',
              label: type.toLowerCase(),
            };
            return (
              <div key={type}>
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <span className={`size-2 rounded-full ${tc.dot}`} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {tc.label}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground/50">
                    {entries.length}
                  </span>
                </div>

                <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
                  {entries.map((mem, i) => (
                    <div
                      key={mem.id}
                      className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      style={{
                        animationDelay: `${i * 40}ms`,
                        animation: 'fadeSlideIn 0.4s ease-out both',
                      }}
                      onClick={() => {
                        setSelectedMem(mem);
                        setEditMode(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <code className="text-sm font-mono font-medium text-primary">
                          {mem.key}
                        </code>
                        <span className="text-xs font-mono text-muted-foreground/50">
                          {new Date(mem.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground/70 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {mem.value}
                      </p>
                      {mem.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {mem.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Memory Detail Sheet */}
      <Sheet
        open={!!selectedMem}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMem(null);
            setEditMode(false);
            if (searchParams.get('open')) router.replace(pathname, { scroll: false });
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selectedMem &&
            (editMode ? (
              /* ---- Edit Mode ---- */
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle>Edit Memory</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-4 flex-1">
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div className="space-y-2">
                      <Label>Key</Label>
                      <Input
                        {...editForm.register('key')}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Controller
                        name="type"
                        control={editForm.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="FEEDBACK">
                                Feedback
                              </SelectItem>
                              <SelectItem value="PROJECT">Project</SelectItem>
                              <SelectItem value="REFERENCE">
                                Reference
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Controller
                      name="value"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          height={180}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      {...editForm.register('tags')}
                      placeholder="Comma-separated"
                    />
                  </div>
                </SheetBody>
                <SheetFooter className="flex gap-2 pt-4 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </SheetFooter>
              </form>
            ) : (
              /* ---- Read Mode ---- */
              <>
                <SheetHeader>
                  <div className="flex items-start justify-between gap-2">
                    <SheetTitle className="font-mono text-base">
                      {selectedMem.key}
                    </SheetTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-7 px-2"
                        aria-label="Edit memory"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(selectedMem)}
                        aria-label="Delete memory"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </SheetHeader>
                <SheetBody className="space-y-5">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const tc = typeConfig[selectedMem.type] ?? {
                        icon: <Brain className="size-3.5" />,
                        dot: 'bg-zinc-400',
                        label: selectedMem.type.toLowerCase(),
                      };
                      return (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          <span
                            className={`size-2 rounded-full ${tc.dot} mr-1.5`}
                          />
                          {tc.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Value
                    </p>
                    <MarkdownPreview
                      source={selectedMem.value}
                      className="text-sm text-foreground/90"
                    />
                  </div>

                  {selectedMem.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Tags
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedMem.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMem.expiresAt && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Expires
                      </p>
                      <p className="text-sm font-mono text-muted-foreground/80">
                        {new Date(selectedMem.expiresAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Last Updated
                    </p>
                    <p className="text-sm font-mono text-muted-foreground/80">
                      {new Date(selectedMem.updatedAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </p>
                  </div>
                </SheetBody>
              </>
            ))}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <MemoryFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={slug}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        entityName="Memory"
        itemTitle={deleteTarget?.key ?? ''}
        onConfirm={() => deleteMutation.mutate(undefined)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
