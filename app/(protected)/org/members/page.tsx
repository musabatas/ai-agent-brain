'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { MemberInviteDialog } from './components/member-invite-dialog';

interface OrgMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case 'OWNER':
      return 'info';
    case 'ADMIN':
      return 'primary';
    default:
      return 'secondary';
  }
};

export default function OrgMembersPage() {
  const queryClient = useQueryClient();
  const orgId = useActiveOrgId();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);

  const {
    data: members = [],
    isLoading,
    isError,
  } = useQuery<OrgMember[]>({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      const res = await apiFetch(`/api/orgs/${orgId}/members`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to load members');
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

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiFetch(
        `/api/orgs/${orgId}/members/${memberId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to remove member');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      toast.success('Member removed');
      setRemoveTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: string;
    }) => {
      const res = await apiFetch(`/api/orgs/${orgId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      toast.success('Role updated');
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
            <ToolbarTitle>Organization Members</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <Card>
          <CardContent className="p-0">
            {isError ? (
              <div className="p-6 text-center text-muted-foreground">
                Failed to load members. Please try again.
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No organization members yet. Invite someone to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user.name || '—'}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={roleBadgeVariant(member.role)}
                          appearance="light"
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {member.role !== 'OWNER' && (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(value) =>
                                  changeRoleMutation.mutate({
                                    memberId: member.id,
                                    role: value,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="MEMBER">Member</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                mode="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setRemoveTarget(member)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Container>

      {orgId && (
        <MemberInviteDialog
          orgId={orgId}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />
      )}

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>
                {removeTarget?.user.name || removeTarget?.user.email}
              </strong>{' '}
              from the organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
