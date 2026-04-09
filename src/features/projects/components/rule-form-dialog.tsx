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
  content: z.string().min(1, 'Content is required').max(10000),
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

type FormValues = z.infer<typeof schema>;

interface RuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export function RuleFormDialog({ open, onClose, slug }: RuleFormDialogProps) {
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
      content: '',
      scope: 'GLOBAL',
      enforcement: 'SHOULD',
      tags: '',
    },
  });

  const mutation = useEntityMutation({
    method: 'POST',
    endpoint: `/api/projects/${slug}/rules`,
    invalidateKeys: [['project-rules', slug]],
    successMessage: 'Rule created',
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
          <DialogTitle>New Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register('title')} placeholder="Rule title" />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                    height={180}
                  />
                )}
              />
              {errors.content && (
                <p className="text-xs text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scope</Label>
                <Controller
                  name="scope"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GLOBAL">Global</SelectItem>
                        <SelectItem value="BACKEND">Backend</SelectItem>
                        <SelectItem value="FRONTEND">Frontend</SelectItem>
                        <SelectItem value="DATABASE">Database</SelectItem>
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
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
              {mutation.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
