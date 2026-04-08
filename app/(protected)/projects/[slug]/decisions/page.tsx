'use client';

import { use, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  Calendar,
  Plus,
  Minus,
  Pencil,
  Trash2,
  X,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { DecisionFormDialog } from './decision-form-dialog';

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; dot: string; label: string }
> = {
  PROPOSED: {
    icon: <Clock className="size-3.5" />,
    color: 'text-sky-400',
    dot: 'bg-sky-400',
    label: 'Proposed',
  },
  ACCEPTED: {
    icon: <CheckCircle2 className="size-3.5" />,
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Accepted',
  },
  DEPRECATED: {
    icon: <AlertTriangle className="size-3.5" />,
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Deprecated',
  },
  SUPERSEDED: {
    icon: <ArrowRight className="size-3.5" />,
    color: 'text-zinc-400',
    dot: 'bg-zinc-400',
    label: 'Superseded',
  },
};

interface Alternative {
  title?: string;
  description?: string;
  pros?: string[];
  cons?: string[];
}

interface Decision {
  id: string;
  title: string;
  status: string;
  context: string;
  decision: string;
  alternatives: Alternative[] | null;
  consequences: string | null;
  tags: string[];
  createdAt: string;
}

const alternativeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
});

const editSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED']),
  context: z.string().min(1).max(10000),
  decision: z.string().min(1).max(10000),
  consequences: z.string().max(10000).optional(),
  alternatives: z.array(alternativeSchema).optional(),
  tags: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function DecisionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Decision | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteEntityQuery<Decision>({
      queryKey: ['project-decisions', slug, debouncedSearch, statusFilter],
      endpoint: `/api/projects/${slug}/decisions`,
      params: {
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
      limit: 30,
    });

  const decisions = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const sentinelRef = useIntersectionObserver(fetchNextPage, {
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Edit form
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const updateMutation = useEntityMutation({
    method: 'PATCH',
    endpoint: `/api/projects/${slug}/decisions/${selectedDecision?.id}`,
    invalidateKeys: [['project-decisions', slug]],
    successMessage: 'Decision updated',
    onSuccess: () => {
      setEditMode(false);
      if (selectedDecision) {
        const vals = editForm.getValues();
        setSelectedDecision({
          ...selectedDecision,
          title: vals.title,
          status: vals.status,
          context: vals.context,
          decision: vals.decision,
          consequences: vals.consequences || null,
          alternatives:
            vals.alternatives
              ?.filter((a) => a.title || a.description)
              .map((a) => ({
                title: a.title || undefined,
                description: a.description || undefined,
                pros: a.pros
                  ? a.pros
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : undefined,
                cons: a.cons
                  ? a.cons
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : undefined,
              })) ?? null,
          tags: vals.tags
            ? vals.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : selectedDecision.tags,
        });
      }
    },
  });

  const deleteMutation = useEntityMutation({
    method: 'DELETE',
    endpoint: `/api/projects/${slug}/decisions/${deleteTarget?.id}`,
    invalidateKeys: [['project-decisions', slug]],
    successMessage: 'Decision deleted',
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedDecision(null);
    },
  });

  const altFieldArray = useFieldArray({
    control: editForm.control,
    name: 'alternatives',
  });

  const handleEdit = () => {
    if (!selectedDecision) return;
    editForm.reset({
      title: selectedDecision.title,
      status: selectedDecision.status as EditValues['status'],
      context: selectedDecision.context,
      decision: selectedDecision.decision,
      consequences: selectedDecision.consequences ?? '',
      alternatives:
        selectedDecision.alternatives?.map((alt) => ({
          title: alt.title ?? '',
          description: alt.description ?? '',
          pros: alt.pros?.join(', ') ?? '',
          cons: alt.cons?.join(', ') ?? '',
        })) ?? [],
      tags: selectedDecision.tags.join(', '),
    });
    setEditMode(true);
  };

  const onEditSubmit = (values: EditValues) => {
    const { tags, alternatives, ...rest } = values;
    updateMutation.mutate({
      ...rest,
      consequences: rest.consequences || undefined,
      alternatives: alternatives
        ?.filter((a) => a.title || a.description)
        .map((a) => ({
          title: a.title || undefined,
          description: a.description || undefined,
          pros: a.pros
            ? a.pros
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
          cons: a.cons
            ? a.cons
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        })) ?? undefined,
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  };

  return (
    <div className="adb-fade-in space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search decisions..."
            className="pl-9 h-9 bg-muted/30 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 bg-muted/30 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PROPOSED">Proposed</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="DEPRECATED">Deprecated</SelectItem>
            <SelectItem value="SUPERSEDED">Superseded</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs adb-mono text-muted-foreground/60">
          {total} decisions
        </span>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-4 mr-1" />
          New Decision
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <p className="text-sm">No decisions found</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/40" />
          <div className="space-y-6">
            {decisions.map((decision, i) => {
              const config = statusConfig[decision.status];
              return (
                <div
                  key={decision.id}
                  className="relative pl-8 cursor-pointer"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    animation: 'fadeSlideIn 0.4s ease-out both',
                  }}
                  onClick={() => {
                    setSelectedDecision(decision);
                    setEditMode(false);
                  }}
                >
                  <div
                    className={`absolute left-0 top-1 size-[22px] rounded-full border-2 border-background flex items-center justify-center ${config.color}`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${config.dot}`}
                    />
                  </div>

                  <div className="adb-project-card rounded-xl p-4 space-y-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {decision.title}
                        </h3>
                        <span className="text-[11px] adb-mono text-muted-foreground/50">
                          {new Date(decision.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${config.color} border-current/20 bg-current/5`}
                      >
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">
                          Context
                        </p>
                        <p className="text-muted-foreground leading-relaxed line-clamp-2">
                          {decision.context}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">
                          Decision
                        </p>
                        <p className="text-foreground/90 leading-relaxed line-clamp-2">
                          {decision.decision}
                        </p>
                      </div>
                    </div>

                    {decision.tags.length > 0 && (
                      <div className="flex gap-1.5 pt-1">
                        {decision.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <p className="text-center text-xs text-muted-foreground/50 py-2">
          Loading more...
        </p>
      )}

      {/* Decision Detail Sheet */}
      <Sheet
        open={!!selectedDecision}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDecision(null);
            setEditMode(false);
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
          {selectedDecision &&
            (editMode ? (
              /* ---- Edit Mode ---- */
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle>Edit Decision</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input {...editForm.register('title')} />
                  </div>
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
                            <SelectItem value="PROPOSED">Proposed</SelectItem>
                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                            <SelectItem value="DEPRECATED">
                              Deprecated
                            </SelectItem>
                            <SelectItem value="SUPERSEDED">
                              Superseded
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Context</Label>
                    <Controller
                      name="context"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          height={120}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Decision</Label>
                    <Controller
                      name="decision"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          height={120}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Consequences</Label>
                    <Controller
                      name="consequences"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          height={100}
                        />
                      )}
                    />
                  </div>
                  {/* Alternatives */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Alternatives</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          altFieldArray.append({
                            title: '',
                            description: '',
                            pros: '',
                            cons: '',
                          })
                        }
                      >
                        <Plus className="size-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {altFieldArray.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="rounded-lg border border-border/50 p-3 space-y-3 relative"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive"
                          onClick={() => altFieldArray.remove(idx)}
                        >
                          <X className="size-3.5" />
                        </Button>
                        <div className="space-y-2 pr-6">
                          <Input
                            {...editForm.register(
                              `alternatives.${idx}.title`,
                            )}
                            placeholder="Alternative title"
                            className="h-8 text-sm"
                          />
                          <Input
                            {...editForm.register(
                              `alternatives.${idx}.description`,
                            )}
                            placeholder="Description"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-emerald-400">
                              Pros
                            </span>
                            <Input
                              {...editForm.register(
                                `alternatives.${idx}.pros`,
                              )}
                              placeholder="Comma-separated"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-red-400">
                              Cons
                            </span>
                            <Input
                              {...editForm.register(
                                `alternatives.${idx}.cons`,
                              )}
                              placeholder="Comma-separated"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {altFieldArray.fields.length === 0 && (
                      <p className="text-xs text-muted-foreground/40 text-center py-2">
                        No alternatives added
                      </p>
                    )}
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
              (() => {
                const config = statusConfig[selectedDecision.status];
                return (
                  <>
                    <SheetHeader>
                      <div className="flex items-start justify-between gap-2">
                        <SheetTitle className="text-lg leading-snug pr-6">
                          {selectedDecision.title}
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
                            onClick={() => setDeleteTarget(selectedDecision)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </SheetHeader>
                    <SheetBody className="space-y-5">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`text-xs gap-1 ${config.color} border-current/20 bg-current/5`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                          <Calendar className="size-3" />
                          {new Date(
                            selectedDecision.createdAt,
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1">
                          Context
                        </p>
                        <MarkdownPreview
                          source={selectedDecision.context}
                          className="text-sm text-muted-foreground"
                        />
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1">
                          Decision
                        </p>
                        <MarkdownPreview
                          source={selectedDecision.decision}
                          className="text-sm text-foreground/90"
                        />
                      </div>

                      {selectedDecision.consequences && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1">
                            Consequences
                          </p>
                          <MarkdownPreview
                            source={selectedDecision.consequences}
                            className="text-sm text-muted-foreground/70"
                          />
                        </div>
                      )}

                      {selectedDecision.alternatives &&
                        Array.isArray(selectedDecision.alternatives) &&
                        selectedDecision.alternatives.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">
                              Alternatives
                            </p>
                            <div className="space-y-3">
                              {selectedDecision.alternatives.map((alt, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-lg border border-border/40 p-3 space-y-2"
                                >
                                  {alt.title && (
                                    <p className="text-sm font-medium">
                                      {alt.title}
                                    </p>
                                  )}
                                  {alt.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {alt.description}
                                    </p>
                                  )}
                                  {alt.pros && alt.pros.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-medium text-emerald-400 mb-0.5">
                                        Pros
                                      </p>
                                      <ul className="space-y-0.5">
                                        {alt.pros.map((pro, j) => (
                                          <li
                                            key={j}
                                            className="text-xs text-emerald-400/80 pl-3 relative before:content-['+'] before:absolute before:left-0 before:text-emerald-400"
                                          >
                                            {pro}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {alt.cons && alt.cons.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-medium text-red-400 mb-0.5">
                                        Cons
                                      </p>
                                      <ul className="space-y-0.5">
                                        {alt.cons.map((con, j) => (
                                          <li
                                            key={j}
                                            className="text-xs text-red-400/80 pl-3 relative before:content-['-'] before:absolute before:left-0 before:text-red-400"
                                          >
                                            {con}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedDecision.tags.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1.5">
                            Tags
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDecision.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[11px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </SheetBody>
                  </>
                );
              })()
            ))}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <DecisionFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={slug}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        entityName="Decision"
        itemTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteMutation.mutate(undefined)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
