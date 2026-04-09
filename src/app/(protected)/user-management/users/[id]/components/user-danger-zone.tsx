'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/app/models/user';
import UserDeleteDialog from './user-delete-dialog';
import UserRestoreDialog from './user-restore-dialog';

const UserDangerZone = ({
  user,
  isLoading,
}: {
  user: User;
  isLoading: boolean;
}) => {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Render skeleton when loading
  const Loading = () => (
    <div className="space-y-3">
      <Skeleton className="h-8 w-36" />
      <Card>
        <CardContent>
          <Skeleton className="h-7 w-40 mb-3" />
          <Skeleton className="h-6 w-full max-w-[560px] mb-4" />
          <Skeleton className="h-9 w-24" />
        </CardContent>
      </Card>
    </div>
  );

  // Content for the "Delete user" Danger Zone
  const DeleteContent = () => (
    <div className="space-y-3">
      <h2 className="font-semibold text-destructive">Danger Zone</h2>
      <Card>
        <CardContent>
          <h3 className="font-semibold mb-3">Delete user account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This action will permanently delete the user and all related data.
            It cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={user.role?.isProtected}
          >
            Delete user
          </Button>
        </CardContent>
      </Card>
      <UserDeleteDialog
        open={isDeleteDialogOpen}
        closeDialog={() => setDeleteDialogOpen(false)}
        user={user}
      />
    </div>
  );

  // Content for restoring a trashed user—modeled after the delete dialog.
  const RestoreContent = () => (
    <div className="space-y-3">
      <h2 className="font-semibold text-destructive">Restore Account</h2>
      <Card>
        <CardContent>
          <h3 className="font-semibold mb-3">Restore user account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This account is currently trashed. Restoring the account will
            reactivate the user and all related data.
          </p>
          <Button variant="outline" onClick={() => setRestoreDialogOpen(true)}>
            Restore user
          </Button>
        </CardContent>
      </Card>
      <UserRestoreDialog
        open={isRestoreDialogOpen}
        closeDialog={() => setRestoreDialogOpen(false)}
        user={user}
      />
    </div>
  );

  // Render loading if still fetching or if user is null.
  return isLoading || !user ? (
    <Loading />
  ) : user.isTrashed ? (
    <RestoreContent />
  ) : (
    <DeleteContent />
  );
};

export default UserDangerZone;
