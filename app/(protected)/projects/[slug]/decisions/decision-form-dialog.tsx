'use client';

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { z } from 'zod';
import { useEntityMutation } from '@/hooks/use-entity-mutation';
import { MarkdownEditor } from '@/components/common/markdown-editor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  status: z.enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED']),
  context: z.string().min(1, 'Context is required').max(10000),
  decision: z.string().min(1, 'Decision is required').max(10000),
  consequences: z.string().max(10000).optional(),
  alternatives: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        pros: z.string().optional(),
        cons: z.string().optional(),
      }),
    )
    .optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface DecisionFormDialogProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export function DecisionFormDialog({
  open,
  onClose,
  slug,
}: DecisionFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      status: 'PROPOSED',
      context: '',
      decision: '',
      consequences: '',
      alternatives: [],
      tags: '',
    },
  });

  const altFieldArray = useFieldArray({
    control,
    name: 'alternatives',
  });

  const mutation = useEntityMutation({
    method: 'POST',
    endpoint: `/api/projects/${slug}/decisions`,
    invalidateKeys: [['project-decisions', slug]],
    successMessage: 'Decision recorded',
    onSuccess: onClose,
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (values: FormValues) => {
    const { tags, alternatives, ...rest } = values;
    mutation.mutate({
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
        })),
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Decision</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...register('title')} placeholder="Decision title" />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROPOSED">Proposed</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                        <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Context</Label>
              <Controller
                name="context"
                control={control}
                render={({ field }) => (
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                    height={120}
                  />
                )}
              />
              {errors.context && (
                <p className="text-xs text-destructive">
                  {errors.context.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Decision</Label>
              <Controller
                name="decision"
                control={control}
                render={({ field }) => (
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                    height={120}
                  />
                )}
              />
              {errors.decision && (
                <p className="text-xs text-destructive">
                  {errors.decision.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Consequences</Label>
              <Controller
                name="consequences"
                control={control}
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
                    aria-label="Remove alternative"
                  >
                    <X className="size-3.5" />
                  </Button>
                  <div className="space-y-2 pr-6">
                    <Input
                      {...register(`alternatives.${idx}.title`)}
                      placeholder="Alternative title"
                      className="h-8 text-sm"
                    />
                    <Input
                      {...register(`alternatives.${idx}.description`)}
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
                        {...register(`alternatives.${idx}.pros`)}
                        placeholder="Comma-separated"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-red-400">
                        Cons
                      </span>
                      <Input
                        {...register(`alternatives.${idx}.cons`)}
                        placeholder="Comma-separated"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {altFieldArray.fields.length === 0 && (
                <p className="text-xs text-muted-foreground/40 text-center py-2">
                  No alternatives — click Add to include options considered
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                {...register('tags')}
                placeholder="Comma-separated tags"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Record Decision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
