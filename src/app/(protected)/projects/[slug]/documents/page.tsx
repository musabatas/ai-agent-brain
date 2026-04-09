'use client';

import { use, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  BookOpen,
  FileCode,
  ScrollText,
  Bookmark,
  Search,
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
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentFormDialog } from '@/features/projects/components/document-form-dialog';

const typeConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  NOTE: {
    icon: <FileText className="size-3.5" />,
    color: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5',
    label: 'Note',
  },
  SPEC: {
    icon: <FileCode className="size-3.5" />,
    color: 'text-sky-400 border-sky-400/20 bg-sky-400/5',
    label: 'Spec',
  },
  GUIDE: {
    icon: <BookOpen className="size-3.5" />,
    color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    label: 'Guide',
  },
  RUNBOOK: {
    icon: <ScrollText className="size-3.5" />,
    color: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
    label: 'Runbook',
  },
  REFERENCE: {
    icon: <Bookmark className="size-3.5" />,
    color: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
    label: 'Reference',
  },
};

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'NOTE', label: 'Note' },
  { value: 'SPEC', label: 'Spec' },
  { value: 'GUIDE', label: 'Guide' },
  { value: 'RUNBOOK', label: 'Runbook' },
  { value: 'REFERENCE', label: 'Reference' },
];

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const editSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['NOTE', 'SPEC', 'GUIDE', 'RUNBOOK', 'REFERENCE']),
  tags: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function DocumentsPage({
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
  const debouncedSearch = useDebouncedValue(search);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteEntityQuery<Document>({
      queryKey: ['project-documents', slug, debouncedSearch, typeFilter],
      endpoint: `/api/projects/${slug}/documents`,
      params: { search: debouncedSearch, type: typeFilter },
      limit: 30,
    });

  const documents = data?.pages.flatMap((p) => p.data) ?? [];

  const openId = searchParams.get('open');
  useEffect(() => {
    if (openId && documents.length > 0 && !selectedDoc) {
      const match = documents.find((d) => d.id === openId);
      if (match) setSelectedDoc(match);
    }
  }, [openId, documents, selectedDoc]);

  const sentinelRef = useIntersectionObserver(() => fetchNextPage(), {
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  // Edit form
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const updateMutation = useEntityMutation({
    method: 'PATCH',
    endpoint: `/api/projects/${slug}/documents/${selectedDoc?.id}`,
    invalidateKeys: [['project-documents', slug]],
    successMessage: 'Document updated',
    onSuccess: () => {
      setEditMode(false);
      if (selectedDoc) {
        const vals = editForm.getValues();
        setSelectedDoc({
          ...selectedDoc,
          ...vals,
          tags: vals.tags
            ? vals.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : selectedDoc.tags,
        });
      }
    },
  });

  const deleteMutation = useEntityMutation({
    method: 'DELETE',
    endpoint: `/api/projects/${slug}/documents/${deleteTarget?.id}`,
    invalidateKeys: [['project-documents', slug]],
    successMessage: 'Document deleted',
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedDoc(null);
    },
  });

  const handleEdit = () => {
    if (!selectedDoc) return;
    editForm.reset({
      title: selectedDoc.title,
      content: selectedDoc.content,
      type: selectedDoc.type as EditValues['type'],
      tags: selectedDoc.tags.join(', '),
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
        <div className="flex gap-3">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-transparent"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-4 mr-1" />
          New Document
        </Button>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <FileText className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents found</p>
          <p className="text-xs mt-1 text-muted-foreground/30">
            {debouncedSearch || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create specs, guides, and notes for your project'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {documents.map((doc, i) => {
            const tc = typeConfig[doc.type] ?? typeConfig.NOTE;
            return (
              <div
                key={doc.id}
                className="bg-card border hover:bg-accent/50 transition-colors rounded-xl p-4 space-y-2.5 cursor-pointer"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animation: 'fadeSlideIn 0.4s ease-out both',
                }}
                onClick={() => {
                  setSelectedDoc(doc);
                  setEditMode(false);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="size-4 text-muted-foreground/60 shrink-0" />
                    <h4 className="text-sm font-semibold truncate">
                      {doc.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${tc.color}`}
                    >
                      {tc.icon}
                      <span className="ml-1">{tc.label}</span>
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground/50">
                      {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground/70 leading-relaxed whitespace-pre-wrap line-clamp-3 pl-6.5">
                  {doc.content}
                </p>

                {doc.tags.length > 0 && (
                  <div className="flex gap-1.5 pl-6.5">
                    {doc.tags.map((tag) => (
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
            );
          })}

          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="space-y-3 pt-1">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          )}
        </div>
      )}

      {/* Document Detail Sheet */}
      <Sheet
        open={!!selectedDoc}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDoc(null);
            setEditMode(false);
            if (searchParams.get('open')) router.replace(pathname, { scroll: false });
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
          {selectedDoc &&
            (editMode ? (
              /* ---- Edit Mode ---- */
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="flex flex-col h-full"
              >
                <SheetHeader>
                  <SheetTitle>Edit Document</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-4 flex-1">
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input {...editForm.register('title')} />
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
                              <SelectItem value="NOTE">Note</SelectItem>
                              <SelectItem value="SPEC">Spec</SelectItem>
                              <SelectItem value="GUIDE">Guide</SelectItem>
                              <SelectItem value="RUNBOOK">Runbook</SelectItem>
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
                    <Label>Content</Label>
                    <Controller
                      name="content"
                      control={editForm.control}
                      render={({ field }) => (
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          height={300}
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
              (() => {
                const tc = typeConfig[selectedDoc.type] ?? typeConfig.NOTE;
                return (
                  <>
                    <SheetHeader>
                      <div className="flex items-start justify-between gap-2">
                        <SheetTitle className="text-base font-semibold leading-snug pr-6">
                          {selectedDoc.title}
                        </SheetTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEdit}
                            className="h-7 px-2"
                            aria-label="Edit document"
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(selectedDoc)}
                            aria-label="Delete document"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${tc.color}`}
                        >
                          {tc.icon}
                          <span className="ml-1">{tc.label}</span>
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground/50">
                          Updated{' '}
                          {new Date(selectedDoc.updatedAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}
                        </span>
                      </div>
                    </SheetHeader>

                    <SheetBody className="space-y-5">
                      <MarkdownPreview
                        source={selectedDoc.content}
                        className="text-sm text-muted-foreground/80"
                      />

                      {selectedDoc.tags.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Tags
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDoc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground/60"
                              >
                                {tag}
                              </span>
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
      <DocumentFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        slug={slug}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        entityName="Document"
        itemTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteMutation.mutate(undefined)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
