'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  description: z.string().max(5000).optional(),
  plan: z.string().max(50000).optional(),
  status: z.enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  sortOrder: z.coerce.number().int().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FeatureFormDialogProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export function FeatureFormDialog({
  open,
  onClose,
  slug,
}: FeatureFormDialogProps) {
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
      plan: '',
      status: 'BACKLOG',
      priority: 'P2',
      sortOrder: 0,
    },
  });

  const mutation = useEntityMutation<FormValues>({
    method: 'POST',
    endpoint: `/api/projects/${slug}/features`,
    invalidateKeys: [['project-features', slug]],
    successMessage: 'Feature created',
    onSuccess: onClose,
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Feature</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register('title')} placeholder="Feature title" />
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

            <div className="space-y-2">
              <Label>Plan</Label>
              <Controller
                name="plan"
                control={control}
                render={({ field }) => (
                  <MarkdownEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    height={150}
                  />
                )}
              />
              <p className="text-[11px] text-muted-foreground/60">
                Implementation approach (optional — can be added later)
              </p>
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
                        <SelectItem value="BACKLOG">Backlog</SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          In Progress
                        </SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
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
              <Label>Display Order</Label>
              <Input
                type="number"
                {...register('sortOrder')}
                placeholder="0"
                className="w-24"
              />
              <p className="text-[11px] text-muted-foreground/60">
                Controls card order within each status column
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
