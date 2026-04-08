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
  key: z.string().min(1, 'Key is required').max(200),
  value: z.string().min(1, 'Value is required'),
  type: z.enum(['USER', 'FEEDBACK', 'PROJECT', 'REFERENCE']),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MemoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export function MemoryFormDialog({
  open,
  onClose,
  slug,
}: MemoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: '',
      value: '',
      type: 'PROJECT',
      tags: '',
    },
  });

  const mutation = useEntityMutation({
    method: 'PUT',
    endpoint: `/api/projects/${slug}/memory`,
    invalidateKeys: [['project-memory', slug]],
    successMessage: 'Memory stored',
    onSuccess: onClose,
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (values: FormValues) => {
    const { tags, ...rest } = values;
    mutation.mutate({
      ...rest,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Memory Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  {...register('key')}
                  placeholder="e.g. preferred-framework"
                  className="font-mono text-sm"
                />
                {errors.key && (
                  <p className="text-xs text-destructive">
                    {errors.key.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="FEEDBACK">Feedback</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="REFERENCE">Reference</SelectItem>
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
                control={control}
                render={({ field }) => (
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                    height={180}
                  />
                )}
              />
              {errors.value && (
                <p className="text-xs text-destructive">
                  {errors.value.message}
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
              {mutation.isPending ? 'Storing...' : 'Store Memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
