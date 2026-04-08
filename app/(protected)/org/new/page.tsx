'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';

const CreateOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters.').max(50),
});
type FormData = z.infer<typeof CreateOrgSchema>;

export default function NewOrgPage() {
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(CreateOrgSchema),
    defaultValues: { name: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const res = await apiFetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create organization');
      }
      const json = await res.json();
      const newOrgId = json.data?.id;
      if (newOrgId) {
        document.cookie = `adb-org-id=${newOrgId}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
      }
      return json;
    },
    onSuccess: () => {
      toast.success('Organization created!');
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Create a New Organization</ToolbarTitle>
          <p className="text-sm text-muted-foreground">
            Organizations are the collaboration boundary — members share projects, API
            keys, and context.
          </p>
        </ToolbarHeading>
      </Toolbar>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="size-5 text-primary" />
            </div>
            <CardTitle>Organization Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="e.g. My Startup, Engineering Org"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
