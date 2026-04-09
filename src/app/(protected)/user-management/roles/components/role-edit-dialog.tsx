'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge, BadgeButton } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoaderCircleIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { UserPermission, UserRole } from '@/app/models/user';
import { usePermissionSelectQuery } from '../../permissions/hooks/use-permission-select-query';
import { RoleSchema, RoleSchemaType } from '../forms/role-schema';

const RoleEditDialog = ({
  open,
  closeDialog,
  role,
}: {
  open: boolean;
  closeDialog: () => void;
  role: UserRole | null;
}) => {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { data: permissionList } = usePermissionSelectQuery();

  const form = useForm<RoleSchemaType>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      permissions: [],
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      const permissionIds: string[] = role?.permissions?.map((p) => p.id) ?? [];

      form.reset({
        name: role?.name || '',
        slug: role?.slug || '',
        description: role?.description ?? '',
        permissions: permissionIds,
      });
      setSelectedPermissions(permissionIds);
    }
  }, [form, open, role]);

  useEffect(() => {
    form.setValue('permissions', selectedPermissions, { shouldDirty: true });
    form.trigger('permissions');
  }, [form, selectedPermissions]);

  const mutation = useMutation({
    mutationFn: async (values: RoleSchemaType) => {
      const isEdit = !!role?.id;
      const url = isEdit
        ? `/api/user-management/roles/${role.id}`
        : '/api/user-management/roles';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const isEdit = !!role?.id;
      const message = isEdit
        ? 'Role updated successfully'
        : 'Role added successfully';

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
          duration: 1000 * 5, // 5 seconds
        },
      );

      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
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

  const isProcessing = mutation.status === 'pending';

  const handleSubmit = (values: RoleSchemaType) => {
    const payload = {
      ...values,
      permissions: selectedPermissions || [],
    };
    mutation.mutate(payload);
  };

  const togglePermissionSelection = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {mutation.status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>{mutation.error.message}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g: users:delete"
                      {...field}
                      disabled={!!role}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <div className="flex items-center flex-wrap gap-1.5 text-2sm text-muted-foreground border border-input rounded-md px-3 py-3">
                    {selectedPermissions.length > 0 ? (
                      selectedPermissions.map((permissionId) => {
                        const permission = permissionList?.find(
                          (p: UserPermission) => p.id === permissionId,
                        );
                        return (
                          <Badge key={permissionId} variant="secondary">
                            {permission?.slug}
                            <BadgeButton
                              onClick={() =>
                                togglePermissionSelection(permissionId)
                              }
                            >
                              <X />
                            </BadgeButton>
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No permissions assigned.
                      </span>
                    )}
                  </div>
                  <div className="space-y-0 pt-1">
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox">
                            Add Permissions
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[200px] p-0 m-0"
                          align="start"
                          side="bottom"
                        >
                          <Command>
                            <CommandInput placeholder="Search permissions..." />
                            <CommandList>
                              <CommandEmpty>No permissions found.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {permissionList?.map(
                                    (permission: UserPermission) => (
                                      <CommandItem
                                        key={permission.id}
                                        onSelect={() =>
                                          togglePermissionSelection(
                                            permission.id,
                                          )
                                        }
                                      >
                                        <span className="grow">
                                          {permission.slug}
                                        </span>
                                        <CommandCheck
                                          className={cn(
                                            selectedPermissions.includes(
                                              permission.id,
                                            )
                                              ? 'opacity-100'
                                              : 'opacity-0',
                                          )}
                                        />
                                      </CommandItem>
                                    ),
                                  )}
                                </ScrollArea>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <LoaderCircleIcon className="animate-spin" />}
                {role ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleEditDialog;
