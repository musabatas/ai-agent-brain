'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
import { User } from '@/app/models/user';

// Validation schema for email confirmation
const EmailConfirmationSchema = (userEmail: string) =>
  z.object({
    confirmEmail: z
      .string()
      .nonempty({ message: 'Email is required.' })
      .email({ message: 'Please enter a valid email address.' })
      .refine((value) => value === userEmail, {
        message: 'Email confirmation does not match.',
      }),
  });

type EmailConfirmationSchemaType = z.infer<
  ReturnType<typeof EmailConfirmationSchema>
>;

interface UserDeleteDialogProps {
  open: boolean;
  closeDialog: () => void;
  user: User;
}

const UserDeleteDialog = ({
  open,
  closeDialog,
  user,
}: UserDeleteDialogProps) => {
  const queryClient = useQueryClient();

  // Set up the form using react-hook-form and zod validation
  const form = useForm<EmailConfirmationSchemaType>({
    resolver: zodResolver(EmailConfirmationSchema(user.email)),
    defaultValues: {
      confirmEmail: '',
    },
    mode: 'onChange',
  });

  // Define the mutation for deleting the user
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/api/user-management/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = 'User deleted successfully.';

      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      // Update user data
      queryClient.invalidateQueries({ queryKey: ['user-user'] });

      //router.push('/user-management/users/');
      closeDialog();
    },
    onError: (error: Error) => {
      const message = error.message;
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );
    },
  });

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-sm text-accent-foreground mb-2.5">
            Deleting user{' '}
            <strong className="text-foreground">{user.email}</strong> will
            permanently remove the account and all related data. This action
            cannot be undone.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-2.5 pt-2.5"
            >
              <FormField
                control={form.control}
                name="confirmEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">
                      Confirm the user&apos;s email address to proceed
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  type="submit"
                  disabled={
                    !form.formState.isDirty ||
                    !form.formState.isValid ||
                    mutation.status === 'pending'
                  }
                >
                  {mutation.status === 'pending' && (
                    <LoaderCircleIcon className="animate-spin" />
                  )}
                  Delete user account
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDeleteDialog;
