'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
import { apiFetch } from '@/lib/api';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  sortOrder: z.coerce.number().int().optional(),
  featureId: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export function TaskFormDialog({ open, onClose, slug }: TaskFormDialogProps) {
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
      description: '',
      status: 'TODO',
      priority: 'P2',
      sortOrder: 0,
      featureId: '',
      tags: '',
    },
  });

  const { data: featuresData } = useQuery({
    queryKey: ['project-features-list', slug],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/projects/${slug}/features?limit=200`,
      );
      if (!res.ok) return { data: [] };
      return res.json();
    },
    staleTime: Infinity,
    enabled: open,
  });

  const features: { id: string; title: string }[] = featuresData?.data ?? [];

  const mutation = useEntityMutation({
    method: 'POST',
    endpoint: `/api/projects/${slug}/tasks`,
    invalidateKeys: [['project-tasks', slug]],
    successMessage: 'Task created',
    onSuccess: onClose,
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (values: FormValues) => {
    const { tags, featureId, ...rest } = values;
    mutation.mutate({
      ...rest,
      featureId: featureId || undefined,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register('title')} placeholder="Task title" />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Controller
                name="description"
                control={control}
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
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P0">P0 — Critical</SelectItem>
                        <SelectItem value="P1">P1 — High</SelectItem>
                        <SelectItem value="P2">P2 — Medium</SelectItem>
                        <SelectItem value="P3">P3 — Low</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Execution Order</Label>
              <Input
                type="number"
                {...register('sortOrder')}
                placeholder="0"
                className="w-24"
              />
              <p className="text-xs text-muted-foreground/60">
                Lower number = executed first. Independent of priority.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Feature</Label>
              <Controller
                name="featureId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(v) =>
                      field.onChange(v === 'none' ? '' : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {features.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                {...register('tags')}
                placeholder="Comma-separated tags"
              />
              <p className="text-xs text-muted-foreground/60">
                e.g. frontend, bug, urgent
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
