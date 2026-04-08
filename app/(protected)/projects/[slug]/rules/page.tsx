'use client';

import { use, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
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
import { RuleFormDialog } from './rule-form-dialog';

const enforcementConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  MUST: {
    icon: <ShieldAlert className="size-3.5" />,
    color: 'text-red-400 border-red-400/20 bg-red-400/5',
    label: 'Must',
  },
  SHOULD: {
    icon: <ShieldCheck className="size-3.5" />,
    color: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    label: 'Should',
  },
  MAY: {
    icon: <ShieldQuestion className="size-3.5" />,
    color: 'text-sky-400 border-sky-400/20 bg-sky-400/5',
    label: 'May',
  },
};

const scopeConfig: Record<string, { dot: string; label: string }> = {
  GLOBAL: { dot: 'bg-violet-400', label: 'Global' },
  BACKEND: { dot: 'bg-emerald-400', label: 'Backend' },
  FRONTEND: { dot: 'bg-sky-400', label: 'Frontend' },
  DATABASE: { dot: 'bg-orange-400', label: 'Database' },
  API: { dot: 'bg-cyan-400', label: 'API' },
  TESTING: { dot: 'bg-pink-400', label: 'Testing' },
  DEVOPS: { dot: 'bg-zinc-400', label: 'DevOps' },
};

interface Rule {
  id: string;
  title: string;
  content: string;
  scope: string;
  enforcement: string;
  isActive: boolean;
  tags: string[];
}

const editSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  scope: z.enum([
    'GLOBAL',
    'BACKEND',
    'FRONTEND',
    'DATABASE',
    'API',
    'TESTING',
    'DEVOPS',
  ]),
  enforcement: z.enum(['MUST', 'SHOULD', 'MAY']),
  tags: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function RulesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteEntityQuery<Rule>({
      queryKey: ['project-rules', slug, debouncedSearch, scopeFilter],
      endpoint: `/api/projects/${slug}/rules`,
      params: { search: debouncedSearch, scope: scopeFilter },
      limit: 100,
    });

  const sentinelRef = useIntersectionObserver(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage,
  });

  const rules = data?.pages.flatMap((p) => p.data) ?? [];

  const grouped = rules.reduce(
    (acc, rule) => {
      (acc[rule.scope] = acc[rule.scope] || []).push(rule);
      return acc;
    },
    {} as Record<string, Rule[]>,
  );

  // Edit form
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const updateMutation = useEntityMutation({
    method: 'PATCH',
    endpoint: `/api/projects/${slug}/rules/${selectedRule?.id}`,
    invalidateKeys: [['project-rules', slug]],
    successMessage: 'Rule updated',
    onSuccess: () => {
      setEditMode(false);
      if (selectedRule) {
        const vals = editForm.getValues();
        setSelectedRule({
          ...selectedRule,
          ...vals,
          tags: vals.tags
            ? vals.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : selectedRule.tags,
        });
      }
    },
  });

  const deleteMutation = useEntityMutation({
    method: 'DELETE',
    endpoint: `/api/projects/${slug}/rules/${deleteTarget?.id}`,
    invalidateKeys: [['project-rules', slug]],
    successMessage: 'Rule deleted',
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedRule(null);
    },
  });

  const handleEdit = () => {
    if (!selectedRule) return;
    editForm.reset({
      title: selectedRule.title,
      content: selectedRule.content,
      scope: selectedRule.scope as EditValues['scope'],
      enforcement: selectedRule.enforcement as EditValues['enforcement'],
      tags: selectedRule.tags.join(', '),
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="GLOBAL">Global</SelectItem>
            <SelectItem value="BACKEND">Backend</SelectItem>
            <SelectItem value="FRONTEND">Frontend</SelectItem>
            <SelectItem value="DATABASE">Database</SelectItem>
            <SelectItem value="API">API</SelectItem>
            <SelectItem value="TESTING">Testing</SelectItem>
            <SelectItem value="DEVOPS">DevOps</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-4 mr-1" />
          New Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <Shield className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No rules found</p>
          <p className="text-xs mt-1 text-muted-foreground/30">
            {debouncedSearch || scopeFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Define coding conventions and project rules'}
          </p>
        </div>
      ) : (
        <div className="space-y-8 adb-fade-in">
          {Object.entries(grouped).map(([scope, scopeRules]) => {
            const sc = scopeConfig[scope] ?? {
              dot: 'bg-zinc-400',
              label: scope.toLowerCase(),
            };
            return (
              <div key={scope}>
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <span className={`size-2 rounded-full ${sc.dot}`} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {sc.label}
                  </span>
                  <span className="text-xs adb-mono text-muted-foreground/50">
                    {scopeRules.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {scopeRules.map((rule, i) => {
                    const enf =
                      enforcementConfig[rule.enforcement] ??
                      enforcementConfig.SHOULD;
                    return (
                      <div
                        key={rule.id}
                        className={`adb-project-card rounded-xl p-4 space-y-2 cursor-pointer ${!rule.isActive ? 'opacity-40' : ''}`}
                        style={{
                          animationDelay: `${i * 60}ms`,
                          animation: 'fadeSlideIn 0.4s ease-out both',
                        }}
                        onClick={() => {
                          setSelectedRule(rule);
                          setEditMode(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold leading-snug">
                            {rule.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${enf.color}`}
                          >
                            {enf.icon}
                            <span className="ml-1">{enf.label}</span>
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {rule.content}
                        </p>

                        {rule.tags.length > 0 && (
                          <div className="flex gap-1.5 pt-0.5">
                            {rule.tags.map((tag) => (
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
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rule Detail Sheet */}
      <Sheet
        open={!!selectedRule}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRule(null);
            setEditMode(false);
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selectedRule &&
            (editMode ? (
              /* ---- Edit Mode ---- */
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle>Edit Rule</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input {...editForm.register('title')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Controller
                      name="content"
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scope</Label>
                      <Controller
                        name="scope"
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
                              <SelectItem value="GLOBAL">Global</SelectItem>
                              <SelectItem value="BACKEND">Backend</SelectItem>
                              <SelectItem value="FRONTEND">
                                Frontend
                              </SelectItem>
                              <SelectItem value="DATABASE">
                                Database
                              </SelectItem>
                              <SelectItem value="API">API</SelectItem>
                              <SelectItem value="TESTING">Testing</SelectItem>
                              <SelectItem value="DEVOPS">DevOps</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Enforcement</Label>
                      <Controller
                        name="enforcement"
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
                              <SelectItem value="MUST">Must</SelectItem>
                              <SelectItem value="SHOULD">Should</SelectItem>
                              <SelectItem value="MAY">May</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
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
                    <SheetTitle>{selectedRule.title}</SheetTitle>
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
                        onClick={() => setDeleteTarget(selectedRule)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </SheetHeader>
                <SheetBody className="space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const enf =
                        enforcementConfig[selectedRule.enforcement] ??
                        enforcementConfig.SHOULD;
                      return (
                        <Badge
                          variant="outline"
                          className={`text-xs ${enf.color}`}
                        >
                          {enf.icon}
                          <span className="ml-1">{enf.label}</span>
                        </Badge>
                      );
                    })()}
                    {(() => {
                      const sc = scopeConfig[selectedRule.scope] ?? {
                        dot: 'bg-zinc-400',
                        label: selectedRule.scope.toLowerCase(),
                      };
                      return (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          <span
                            className={`size-2 rounded-full ${sc.dot} mr-1.5`}
                          />
                          {sc.label}
                        </Badge>
                      );
                    })()}
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        selectedRule.isActive
                          ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                          : 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5'
                      }`}
                    >
                      {selectedRule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Content
                    </p>
                    <MarkdownPreview
                      source={selectedRule.content}
                      className="text-sm text-foreground/90"
                    />
                  </div>

                  {selectedRule.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Tags
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedRule.tags.map((tag) => (
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
                </SheetBody>
              </>
            ))}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <RuleFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={slug}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        entityName="Rule"
        itemTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteMutation.mutate(undefined)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
