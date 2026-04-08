'use client';

import { use, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { useEntityMutation } from '@/hooks/use-entity-mutation';
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
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureFormDialog } from './feature-form-dialog';

const statusColumns = [
  { key: 'BACKLOG', label: 'Backlog', dotColor: 'bg-zinc-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-sky-400' },
  { key: 'REVIEW', label: 'Review', dotColor: 'bg-amber-400' },
  { key: 'DONE', label: 'Done', dotColor: 'bg-emerald-400' },
];

const priorityStyles: Record<string, string> = {
  P0: 'text-red-400 border-red-400/30 bg-red-400/5',
  P1: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  P2: 'text-sky-400 border-sky-400/30 bg-sky-400/5',
  P3: 'text-zinc-400 border-zinc-400/30 bg-zinc-400/5',
};

const statusDotColors: Record<string, string> = {
  BACKLOG: 'bg-zinc-400',
  IN_PROGRESS: 'bg-sky-400',
  REVIEW: 'bg-amber-400',
  DONE: 'bg-emerald-400',
  TODO: 'bg-zinc-400',
  BLOCKED: 'bg-red-400',
};

interface Feature {
  id: string;
  title: string;
  description: string | null;
  plan: string | null;
  status: string;
  priority: string;
  sortOrder: number;
  _count: { tasks: number };
  tasks: { id: string; title: string; status: string; priority: string }[];
}

const editSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  plan: z.string().max(50000).optional(),
  status: z.enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  sortOrder: z.coerce.number().int().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function FeaturesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['project-features', slug, debouncedSearch],
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set('limit', '200');
      if (debouncedSearch) sp.set('search', debouncedSearch);
      const res = await apiFetch(
        `/api/projects/${slug}/features?${sp.toString()}`,
      );
      if (!res.ok) throw new Error('Failed to load features');
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const features: Feature[] = data?.data ?? [];

  const { data: featureDetail, isLoading: detailLoading } = useQuery<Feature>({
    queryKey: ['project-feature-detail', slug, selectedFeatureId],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/projects/${slug}/features/${selectedFeatureId}`,
      );
      if (!res.ok) throw new Error('Failed to load feature');
      return res.json();
    },
    enabled: !!selectedFeatureId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Edit form
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const updateMutation = useEntityMutation<EditValues>({
    method: 'PATCH',
    endpoint: `/api/projects/${slug}/features/${selectedFeatureId}`,
    invalidateKeys: [
      ['project-features', slug],
      ['project-feature-detail', slug, selectedFeatureId],
    ],
    successMessage: 'Feature updated',
    onSuccess: () => setEditMode(false),
  });

  const deleteMutation = useEntityMutation({
    method: 'DELETE',
    endpoint: `/api/projects/${slug}/features/${deleteTarget?.id}`,
    invalidateKeys: [['project-features', slug]],
    successMessage: 'Feature deleted',
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedFeatureId(null);
    },
  });

  const handleEdit = () => {
    if (!featureDetail) return;
    editForm.reset({
      title: featureDetail.title,
      description: featureDetail.description ?? '',
      plan: featureDetail.plan ?? '',
      status: featureDetail.status as EditValues['status'],
      priority: featureDetail.priority as EditValues['priority'],
      sortOrder: featureDetail.sortOrder ?? 0,
    });
    setEditMode(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 adb-stagger">
          {statusColumns.map((col) => (
            <div key={col.key} className="space-y-3">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const detail = featureDetail;
  const detailDone =
    detail?.tasks.filter((t) => t.status === 'DONE').length ?? 0;
  const detailTotal = detail?.tasks.length ?? 0;

  return (
    <>
      {/* Search + Create */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-transparent"
          />
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-4 mr-1" />
          New Feature
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 adb-fade-in">
        {statusColumns.map((col) => {
          const colFeatures = features.filter((f) => f.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs adb-mono text-muted-foreground/60">
                  {colFeatures.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[120px]">
                {colFeatures.map((feature) => {
                  const doneCount = feature.tasks.filter(
                    (t) => t.status === 'DONE',
                  ).length;
                  const totalTasks = feature.tasks.length;
                  const progress =
                    totalTasks > 0
                      ? Math.round((doneCount / totalTasks) * 100)
                      : 0;

                  return (
                    <div
                      key={feature.id}
                      className="adb-project-card rounded-xl p-3.5 cursor-pointer"
                      onClick={() => {
                        setSelectedFeatureId(feature.id);
                        setEditMode(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-medium leading-snug">
                          {feature.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 shrink-0 ${priorityStyles[feature.priority]}`}
                        >
                          {feature.priority}
                        </Badge>
                      </div>

                      {feature.description && (
                        <p className="text-xs text-muted-foreground/70 mb-3 line-clamp-2 leading-relaxed">
                          {feature.description}
                        </p>
                      )}

                      {totalTasks > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Layers className="size-3" />
                              <span className="adb-mono">
                                {doneCount}/{totalTasks}
                              </span>
                            </span>
                            <span className="text-[11px] adb-mono text-muted-foreground/60">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-1">
                            <div
                              className="rounded-full h-1 transition-all duration-500 ease-out"
                              style={{
                                width: `${progress}%`,
                                background:
                                  progress === 100
                                    ? 'var(--color-emerald-400)'
                                    : 'var(--adb-accent)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {colFeatures.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/40">
                      No features
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Detail Sheet */}
      <Sheet
        open={!!selectedFeatureId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFeatureId(null);
            setEditMode(false);
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {detailLoading ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : detail ? (
            editMode ? (
              /* ---- Edit Mode ---- */
              <form
                onSubmit={editForm.handleSubmit((v) =>
                  updateMutation.mutate(v),
                )}
                className="flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle>Edit Feature</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input {...editForm.register('title')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Controller
                      name="description"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          height={150}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Controller
                      name="plan"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          height={200}
                        />
                      )}
                    />
                    <p className="text-[11px] text-muted-foreground/60">
                      Implementation approach — architecture, steps, constraints
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                        name="status"
                        control={editForm.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BACKLOG">Backlog</SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                In Progress
                              </SelectItem>
                              <SelectItem value="REVIEW">Review</SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                              <SelectItem value="CANCELLED">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Controller
                        name="priority"
                        control={editForm.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="P0">P0</SelectItem>
                              <SelectItem value="P1">P1</SelectItem>
                              <SelectItem value="P2">P2</SelectItem>
                              <SelectItem value="P3">P3</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      {...editForm.register('sortOrder')}
                      placeholder="0"
                      className="w-24"
                    />
                    <p className="text-[11px] text-muted-foreground/60">
                      Order within status column (lower = first)
                    </p>
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
                    <SheetTitle className="text-base font-semibold leading-snug pr-6">
                      {detail.title}
                    </SheetTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-7 px-2"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(detail)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${priorityStyles[detail.priority]}`}
                    >
                      {detail.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <span
                        className={`size-1.5 rounded-full mr-1 ${statusDotColors[detail.status] ?? 'bg-zinc-400'}`}
                      />
                      {detail.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </SheetHeader>

                <SheetBody className="space-y-5">
                  {detail.description && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Description
                      </h5>
                      <MarkdownPreview
                        source={detail.description}
                        className="text-sm text-muted-foreground/80"
                      />
                    </div>
                  )}

                  {detail.plan && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Plan
                      </h5>
                      <div className="rounded-lg border border-border/40 p-3">
                        <MarkdownPreview
                          source={detail.plan}
                          className="text-sm text-foreground/90"
                        />
                      </div>
                    </div>
                  )}

                  {detailTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tasks
                        </h5>
                        <span className="text-[11px] adb-mono text-muted-foreground/60">
                          {detailDone}/{detailTotal} done
                        </span>
                      </div>

                      <div className="w-full bg-muted/50 rounded-full h-1.5 mb-3">
                        <div
                          className="rounded-full h-1.5 transition-all duration-500 ease-out"
                          style={{
                            width: `${detailTotal > 0 ? Math.round((detailDone / detailTotal) * 100) : 0}%`,
                            background:
                              detailDone === detailTotal
                                ? 'var(--color-emerald-400)'
                                : 'var(--adb-accent)',
                          }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        {detail.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30"
                          >
                            <span
                              className={`size-2 rounded-full shrink-0 ${statusDotColors[task.status] ?? 'bg-zinc-400'}`}
                            />
                            <span
                              className={`text-sm flex-1 ${task.status === 'DONE' ? 'text-muted-foreground/50 line-through' : ''}`}
                            >
                              {task.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 shrink-0 ${priorityStyles[task.priority] ?? ''}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </SheetBody>
              </>
            )
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <FeatureFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={slug}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        entityName="Feature"
        itemTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteMutation.mutate(undefined)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
