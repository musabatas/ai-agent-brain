'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Trash2 } from 'lucide-react';
import { useActiveOrgId } from '@/hooks/use-active-org';
import { toast } from 'sonner';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Container } from '@/components/common/container';
import { ContentLoader } from '@/components/common/content-loader';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { ApiKeyCreateDialog } from '@/features/org/components/api-key-create-dialog';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function OrgApiKeysPage() {
  const queryClient = useQueryClient();
  const orgId = useActiveOrgId();

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const {
    data: apiKeys = [],
    isLoading,
    isError,
  } = useQuery<ApiKey[]>({
    queryKey: ['org-api-keys', orgId],
    queryFn: async () => {
      const res = await apiFetch(`/api/orgs/${orgId}/api-keys`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to load API keys');
      }
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!orgId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiFetch(`/api/orgs/${orgId}/api-keys/${keyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to revoke API key');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-api-keys', orgId] });
      toast.success('API key revoked');
      setRevokeTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>API Keys</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={() => setCreateOpen(true)}>
              <KeyRound className="size-4" />
              Create API Key
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <Card>
          <CardContent className="p-0">
            {isError ? (
              <div className="p-6 text-center text-muted-foreground">
                Failed to load API keys. Please try again.
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No API keys yet. Create one to get started.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                          {apiKey.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {apiKey.lastUsedAt ? timeAgo(apiKey.lastUsedAt) : 'Never'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={apiKey.isActive ? 'success' : 'destructive'}
                          appearance="light"
                        >
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          mode="icon"
                          aria-label="Revoke API key"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRevokeTarget(apiKey)}
                          disabled={!apiKey.isActive}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>

      {orgId && (
        <ApiKeyCreateDialog
          orgId={orgId}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{' '}
              <strong>{revokeTarget?.name}</strong>? Any applications using this
              key will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                revokeTarget && revokeMutation.mutate(revokeTarget.id)
              }
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
