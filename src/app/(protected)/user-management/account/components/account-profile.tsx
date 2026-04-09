'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  AccountProfileSchema,
  AccountProfileSchemaType,
} from '../forms/account-profile-schema';
import { useAccount } from './account-context';
import { LoaderCircleIcon } from 'lucide-react';

export default function AccountDetails() {
  const queryClient = useQueryClient();
  const { data: session, update: updateSession } = useSession();
  const { user } = useAccount();

  const [avatarExistingPreview, setAvatarExistingPreview] = useState<
    string | null
  >(null);
  const [avatarAttachedPreview, setAvatarAttachedPreview] = useState<
    string | null
  >(null);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  // Ensure all fields have default values
  const transformedProfile: AccountProfileSchemaType = {
    ...user,
    avatarFile: null,
    avatarAction: '',
    name: user?.name || '',
  };

  useEffect(() => {
    if (user?.avatar) {
      setAvatarExistingPreview(user.avatar);
      setAvatarAttachedPreview(null);
    }
  }, [user]);

  const form = useForm<AccountProfileSchemaType>({
    resolver: zodResolver(AccountProfileSchema),
    defaultValues: transformedProfile,
    mode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: async (values: AccountProfileSchemaType) => {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key === 'avatarFile' && values.avatarFile instanceof File) {
          formData.append('avatarFile', values.avatarFile);
        } else if (key !== 'avatarFile') {
          formData.append(
            key,
            values[key as keyof AccountProfileSchemaType] as string,
          );
        }
      });

      const response = await apiFetch('/api/user-management/account/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['account-profile'] });

      toast.custom(() => (
        <Alert variant="mono" icon="success">
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>Account updated successfully</AlertTitle>
        </Alert>
      ));

      setTimeout(() => {
        // Update user session and reload app
        if (session) {
          updateSession({
            user: updatedUser,
          });
        }
      }, 1000);
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );
    },
  });

  const isProcessing = mutation.status === 'pending';

  const handleRemoveAvatar = () => {
    setAvatarExistingPreview(null);
    form.trigger('avatarFile');
    form.setValue('avatarFile', null);
    form.setValue('avatarAction', 'remove', { shouldDirty: true });
  };

  const handleCancelAvatar = () => {
    setAvatarAttachedPreview(null);
    if (user.avatar) {
      setAvatarExistingPreview(user.avatar);
    }
    form.setValue('avatarFile', null);
    form.setValue('avatarAction', '', { shouldDirty: true });
  };

  const handleChangeAvatar = (
    e: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<AccountProfileSchemaType, 'avatarFile'>,
  ) => {
    const file = e.target.files?.[0] || null;
    field.onChange(file);
    form.trigger('avatarFile');
    form.setValue('avatarFile', file);
    form.setValue('avatarAction', 'save', { shouldDirty: true });

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarAttachedPreview(null);
    }
  };

  const handleFormReset = () => {
    form.reset(transformedProfile);
  };

  const handleSubmit = (values: AccountProfileSchemaType) => {
    mutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardHeading>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage profile information</CardDescription>
        </CardHeading>
      </CardHeader>
      <CardContent className="py-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 lg:w-[500px] mx-auto"
          >
            {/* Avatar */}
            <FormField
              control={form.control}
              name="avatarFile"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-5">
                    <Avatar className="size-24">
                      <AvatarImage
                        src={
                          avatarAttachedPreview ||
                          avatarExistingPreview ||
                          undefined
                        }
                        alt={user.name || ''}
                      />
                      <AvatarFallback className="text-2xl">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <FormLabel>Profile Avatar</FormLabel>
                      <FormControl className="my-1.5">
                        <div className="flex flex-col space-y-1">
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => avatarFileRef.current?.click()}
                            >
                              Attach Image
                            </Button>

                            {avatarAttachedPreview ||
                            (!avatarAttachedPreview &&
                              !avatarExistingPreview &&
                              user.avatar) ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelAvatar}
                              >
                                Cancel
                              </Button>
                            ) : null}

                            {user.avatar &&
                            avatarExistingPreview &&
                            !avatarAttachedPreview ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleRemoveAvatar}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                          <input
                            ref={avatarFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleChangeAvatar(e, field)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        We support PNGs, JPEGs, and GIFs under 1MB.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={handleFormReset}>
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || isProcessing}
              >
                {isProcessing && <LoaderCircleIcon className="animate-spin" />}
                Save Profile
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
