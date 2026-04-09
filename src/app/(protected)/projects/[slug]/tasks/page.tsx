'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Clock,
  Ban,
  AlertTriangle,
  Search,
  Link2,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
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
import { TaskFormDialog } from './task-form-dialog';

const statusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; dot: string }
> = {
  TODO: {
    icon: <Circle className="size-3.5 text-zinc-400" />,
    label: 'Todo',
    dot: 'bg-zinc-400',
  },
  IN_PROGRESS: {
    icon: <Clock className="size-3.5 text-sky-400" />,
    label: 'In Progress',
    dot: 'bg-sky-400',
  },
  DONE: {
    icon: <CheckCircle2 className="size-3.5 text-emerald-400" />,
    label: 'Done',
    dot: 'bg-emerald-400',
  },
  BLOCKED: {
    icon: <AlertTriangle className="size-3.5 text-red-400" />,
    label: 'Blocked',
    dot: 'bg-red-400',
  },
  CANCELLED: {
    icon: <Ban className="size-3.5 text-zinc-500" />,
    label: 'Cancelled',
    dot: 'bg-zinc-500',
  },
};

const priorityStyles: Record<string, string> = {
  P0: 'text-red-400 border-red-400/30 bg-red-400/5',
  P1: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  P2: 'text-sky-400 border-sky-400/30 bg-sky-400/5',
  P3: 'text-zinc-400 border-zinc-400/30 bg-zinc-400/5',
};

interface DepRef {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  sortOrder: number;
  tags: string[];
  dependsOn: string[];
  feature: { id: string; title: string } | null;
  completedAt: string | null;
  createdAt: string;
}

interface TaskDetail extends Task {
  dependsOnTasks: DepRef[];
  blocks: DepRef[];
}

const editSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  sortOrder: z.coerce.number().int().optional(),
  dependsOn: z.array(z.string()).optional(),
  tags: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function TasksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteEntityQuery<Task>({
      queryKey: [
        'project-tasks',
        slug,
        debouncedSearch,
        statusFilter,
        priorityFilter,
      ],
      endpoint: `/api/projects/${slug}/tasks`,
      params: {
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      },
      limit: 50,
    });

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  // Auto-open item from ?open= query param (e.g. from global search)
  const openId = searchParams.get('open');
  useEffect(() => {
    if (openId && tasks.length > 0 && !selectedTask) {
      const match = tasks.find((t) => t.id === openId);
      if (match) setSelectedTask(match);
    }
  }, [openId, tasks, selectedTask]);

  const sentinelRef = useIntersectionObserver(fetchNextPage, {
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Detail query (resolves dependencies)
  const { data: taskDetailData } = useQuery<{ data: TaskDetail }>({
    queryKey: ['project-task-detail', slug, selectedTask?.id],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/projects/${slug}/tasks/${selectedTask!.id}`,
      );
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!selectedTask && !editMode,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const taskDetail = taskDetailData?.data;

  // Prev/next navigation
  const currentIdx = selectedTask
    ? tasks.findIndex((t) => t.id === selectedTask.id)
    : -1;
  const prevTask = currentIdx > 0 ? tasks[currentIdx - 1] : null;
  const nextTask =
    currentIdx >= 0 && currentIdx < tasks.length - 1
      ? tasks[currentIdx + 1]
      : null;

  // Edit form
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const updateMutation = useEntityMutation({
    method: 'PATCH',
    endpoint: `/api/projects/${slug}/tasks/${selectedTask?.id}`,
    invalidateKeys: [['project-tasks', slug]],
    successMessage: 'Task updated',
    onSuccess: () => {
      setEditMode(false);
      // Update local state
      if (selectedTask) {
        const vals = editForm.getValues();
        setSelectedTask({
          ...selectedTask,
          ...vals,
          tags: vals.tags
            ? vals.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : selectedTask.tags,
        });
      }
    },
  });

  const deleteMutation = useEntityMutation({
    method: 'DELETE',
    endpoint: `/api/projects/${slug}/tasks/${deleteTarget?.id}`,
    invalidateKeys: [['project-tasks', slug]],
    successMessage: 'Task deleted',
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedTask(null);
    },
  });

  const handleEdit = () => {
    if (!selectedTask) return;
    editForm.reset({
      title: selectedTask.title,
      description: selectedTask.description ?? '',
      status: selectedTask.status as EditValues['status'],
      priority: selectedTask.priority as EditValues['priority'],
      sortOrder: selectedTask.sortOrder ?? 0,
      dependsOn: selectedTask.dependsOn ?? [],
      tags: selectedTask.tags.join(', '),
    });
    setEditMode(true);
  };

  const onEditSubmit = (values: EditValues) => {
    const { tags, dependsOn, ...rest } = values;
    updateMutation.mutate({
      ...rest,
      dependsOn: dependsOn ?? [],
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  };

  return (
    <div className="space-y-4 adb-fade-in">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search tasks..."
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
            <SelectItem value="TODO">Todo</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-28 h-9 bg-muted/30 border-border/50">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="P0">P0</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs adb-mono text-muted-foreground/60">
          {total} tasks
        </span>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <Circle className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
          {tasks.map((task, i) => {
            const config = statusConfig[task.status];
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                onClick={() => {
                  setSelectedTask(task);
                  setEditMode(false);
                }}
              >
                <span className="shrink-0">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                    {task.title}
                  </p>
                  {task.feature && (
                    <p className="text-[11px] text-muted-foreground/50 truncate">
                      {task.feature.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/60"
                    >
                      {tag}
                    </span>
                  ))}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${priorityStyles[task.priority]}`}
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <p className="text-center text-xs text-muted-foreground/50 py-2">
          Loading more...
        </p>
      )}

      {/* Task Detail Sheet */}
      <Sheet
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setEditMode(false);
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selectedTask &&
            (editMode ? (
              /* ---- Edit Mode ---- */
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle>Edit Task</SheetTitle>
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
                              <SelectItem value="TODO">Todo</SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                In Progress
                              </SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                              <SelectItem value="BLOCKED">Blocked</SelectItem>
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
                    <Label>Order</Label>
                    <Input
                      type="number"
                      {...editForm.register('sortOrder')}
                      placeholder="0"
                      className="w-24"
                    />
                    <p className="text-[11px] text-muted-foreground/60">
                      Lower = executed first
                    </p>
                  </div>

                  {/* Dependencies */}
                  <div className="space-y-2">
                    <Label>Depends On</Label>
                    <Controller
                      name="dependsOn"
                      control={editForm.control}
                      render={({ field }) => {
                        const selected = field.value ?? [];
                        const available = tasks.filter(
                          (t) =>
                            t.id !== selectedTask?.id &&
                            !selected.includes(t.id),
                        );
                        return (
                          <div className="space-y-2">
                            {selected.length > 0 && (
                              <div className="space-y-1">
                                {selected.map((depId) => {
                                  const dep = tasks.find(
                                    (t) => t.id === depId,
                                  );
                                  return (
                                    <div
                                      key={depId}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30 text-sm"
                                    >
                                      <span
                                        className={`size-2 rounded-full shrink-0 ${statusConfig[dep?.status ?? 'TODO']?.dot ?? 'bg-zinc-400'}`}
                                      />
                                      <span className="flex-1 truncate">
                                        {dep?.title ?? depId}
                                      </span>
                                      <button
                                        type="button"
                                        className="text-muted-foreground/50 hover:text-destructive"
                                        aria-label="Remove dependency"
                                        onClick={() =>
                                          field.onChange(
                                            selected.filter(
                                              (id) => id !== depId,
                                            ),
                                          )
                                        }
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {available.length > 0 && (
                              <Select
                                value=""
                                onValueChange={(id) =>
                                  field.onChange([...selected, id])
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Add dependency..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {available.map((t) => (
                                    <SelectItem
                                      key={t.id}
                                      value={t.id}
                                      className="text-xs"
                                    >
                                      {t.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      }}
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
                    <SheetTitle className="text-lg leading-snug pr-6">
                      {selectedTask.title}
                    </SheetTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-7 px-2"
                        aria-label="Edit task"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(selectedTask)}
                        aria-label="Delete task"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </SheetHeader>
                <SheetBody className="space-y-5">
                  {/* Status, Priority & Order */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs gap-1">
                      {statusConfig[selectedTask.status]?.icon}
                      {statusConfig[selectedTask.status]?.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityStyles[selectedTask.priority]}`}
                    >
                      {selectedTask.priority}
                    </Badge>
                    {selectedTask.sortOrder > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        #{selectedTask.sortOrder}
                      </Badge>
                    )}
                  </div>

                  {selectedTask.feature && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Link2 className="size-3.5" />
                      <span>{selectedTask.feature.title}</span>
                    </div>
                  )}

                  {selectedTask.description && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1">
                        Description
                      </p>
                      <MarkdownPreview
                        source={selectedTask.description}
                        className="text-sm text-muted-foreground"
                      />
                    </div>
                  )}

                  {/* Blocked By (depends on) */}
                  {taskDetail?.dependsOnTasks &&
                    taskDetail.dependsOnTasks.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1.5 flex items-center gap-1">
                          <GitBranch className="size-3" />
                          Blocked By
                        </p>
                        <div className="space-y-1">
                          {taskDetail.dependsOnTasks.map((dep) => (
                            <div
                              key={dep.id}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                const t = tasks.find(
                                  (tt) => tt.id === dep.id,
                                );
                                if (t) setSelectedTask(t);
                              }}
                            >
                              <span
                                className={`size-2 rounded-full shrink-0 ${statusConfig[dep.status]?.dot ?? 'bg-zinc-400'}`}
                              />
                              <span
                                className={`flex-1 truncate ${dep.status === 'DONE' ? 'text-muted-foreground/50 line-through' : ''}`}
                              >
                                {dep.title}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1 py-0 ${priorityStyles[dep.priority] ?? ''}`}
                              >
                                {dep.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Blocks (reverse deps) */}
                  {taskDetail?.blocks && taskDetail.blocks.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1.5 flex items-center gap-1">
                        <ArrowRight className="size-3" />
                        Blocks
                      </p>
                      <div className="space-y-1">
                        {taskDetail.blocks.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              const t = tasks.find((tt) => tt.id === dep.id);
                              if (t) setSelectedTask(t);
                            }}
                          >
                            <span
                              className={`size-2 rounded-full shrink-0 ${statusConfig[dep.status]?.dot ?? 'bg-zinc-400'}`}
                            />
                            <span className="flex-1 truncate">
                              {dep.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${priorityStyles[dep.priority] ?? ''}`}
                            >
                              {dep.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.tags.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1.5">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTask.tags.map((tag) => (
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

                  <div className="flex items-center gap-4 text-xs text-muted-foreground/60 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>
                        Created{' '}
                        {new Date(selectedTask.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    </div>
                    {selectedTask.completedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-400" />
                        <span>
                          Completed{' '}
                          {new Date(
                            selectedTask.completedAt,
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </SheetBody>

                {/* Prev/Next navigation */}
                {(prevTask || nextTask) && (
                  <SheetFooter className="flex justify-between pt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      disabled={!prevTask}
                      onClick={() => prevTask && setSelectedTask(prevTask)}
                    >
                      <ChevronLeft className="size-3 mr-1" />
                      Prev
                    </Button>
                    <span className="text-[10px] adb-mono text-muted-foreground/40 self-center">
                      {currentIdx + 1}/{tasks.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      disabled={!nextTask}
                      onClick={() => nextTask && setSelectedTask(nextTask)}
                    >
                      Next
                      <ChevronRight className="size-3 ml-1" />
                    </Button>
                  </SheetFooter>
                )}
              </>
            ))}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <TaskFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={slug}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        entityName="Task"
        itemTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteMutation.mutate(undefined)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
