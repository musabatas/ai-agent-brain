'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useActiveOrgId } from '@/hooks/use-active-org';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiFetch } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Container } from '@/components/common/container';
import { ContentLoader } from '@/components/common/content-loader';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';

const orgSettingsSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

type OrgSettingsForm = z.infer<typeof orgSettingsSchema>;

interface OrgData {
  id: string;
  name: string;
  slug: string;
}

export default function OrgSettingsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const orgId = useActiveOrgId();

  const {
    data: org,
    isLoading,
    isError,
  } = useQuery<OrgData>({
    queryKey: ['org-details', orgId],
    queryFn: async () => {
      const res = await apiFetch(`/api/orgs/${orgId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to load organization');
      }
      return res.json();
    },
    enabled: !!orgId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrgSettingsForm>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (org) {
      reset({ name: org.name });
    }
  }, [org, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: OrgSettingsForm) => {
      const res = await apiFetch(`/api/orgs/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update organization');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-details', orgId] });
      toast.success('Organization settings updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/orgs/${orgId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete organization');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Organization deleted');
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  if (isError) {
    return (
      <Container>
        <div className="py-20 text-center text-muted-foreground">
          Failed to load organization settings.
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Organization Settings</ToolbarTitle>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-6">
          <Card>
            <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))}>
              <CardHeader>
                <CardTitle>General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    {...register('name')}
                    placeholder="My Organization"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Organization Slug</Label>
                  <Input
                    id="org-slug"
                    value={org?.slug || ''}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from your organization name. Cannot be changed.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all of its data. This action
                cannot be undone.
              </p>
            </CardContent>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Organization</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete{' '}
                      <strong>{org?.name}</strong> and all associated data
                      including members, API keys, and projects. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                    >
                      {deleteMutation.isPending
                        ? 'Deleting...'
                        : 'Delete Organization'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </Container>
    </>
  );
}
