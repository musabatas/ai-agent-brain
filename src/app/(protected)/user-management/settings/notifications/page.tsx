'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppWindowMac,
  Bell,
  LoaderCircleIcon,
  MailWarning,
  UserPlus,
  Users,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSettings } from '../components/settings-context';
import {
  NotificationSettingsSchema,
  NotificationSettingsSchemaType,
} from '../forms/notification-settings-schema';

const notificationSettings = [
  {
    label: 'Stock Alerts',
    description: 'Notify when stock reaches the threshold.',
    emailField: 'notifyStockEmail',
    webField: 'notifyStockWeb',
    roleIdsField: 'notifyStockRoleIds',
  },
  {
    label: 'New Orders',
    description: 'Notify when new orders are received.',
    emailField: 'notifyNewOrderEmail',
    webField: 'notifyNewOrderWeb',
    roleIdsField: 'notifyNewOrderRoleIds',
  },
  {
    label: 'Order Status Updates',
    description: 'Notify when an order status is updated.',
    emailField: 'notifyOrderStatusUpdateEmail',
    webField: 'notifyOrderStatusUpdateWeb',
    roleIdsField: 'notifyOrderStatusUpdateRoleIds',
  },
  {
    label: 'Payment Failures',
    description: 'Notify when a payment failure occurs.',
    emailField: 'notifyPaymentFailureEmail',
    webField: 'notifyPaymentFailureWeb',
    roleIdsField: 'notifyPaymentFailureRoleIds',
  },
  {
    label: 'System Errors',
    description: 'Notify when system errors occur.',
    emailField: 'notifySystemErrorFailureEmail',
    webField: 'notifySystemErrorWeb',
    roleIdsField: 'notifySystemErrorRoleIds',
  },
];

const NotificationSettingsPage = () => {
  const queryClient = useQueryClient();
  const { settings, roles } = useSettings();

  const form = useForm<NotificationSettingsSchemaType>({
    resolver: zodResolver(NotificationSettingsSchema),
    defaultValues: notificationSettings.reduce<
      Partial<NotificationSettingsSchemaType>
    >(
      (defaults, { emailField, webField, roleIdsField }) => ({
        ...defaults,
        [emailField]:
          (settings as NotificationSettingsSchemaType)[
            emailField as keyof NotificationSettingsSchemaType
          ] ?? false,
        [webField]:
          (settings as NotificationSettingsSchemaType)[
            webField as keyof NotificationSettingsSchemaType
          ] ?? false,
        [roleIdsField]:
          (settings as NotificationSettingsSchemaType)[
            roleIdsField as keyof NotificationSettingsSchemaType
          ] ?? [],
      }),
      {},
    ),
  });

  const mutation = useMutation({
    mutationFn: async (values: NotificationSettingsSchemaType) => {
      const response = await apiFetch(
        '/api/user-management/settings/notifications',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Settings updated successfully</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
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

  const handleSubmit = (values: NotificationSettingsSchemaType) => {
    mutation.mutate(values);
  };

  const handleReset = () => {
    form.reset();
  };

  const toggleRoleSelection = (
    field: keyof NotificationSettingsSchemaType,
    roleId: string,
  ) => {
    const currentValues = form.getValues()[field] as string[];
    const updatedValues = currentValues.includes(roleId)
      ? currentValues.filter((id) => id !== roleId)
      : [...currentValues, roleId];

    form.setValue(field, updatedValues, { shouldDirty: true });
  };

  const isProcessing = mutation.status === 'pending';

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Form {...form}>
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-2.5">
            <Table>
              <TableHeader>
                <TableRow className="text-2sm">
                  <TableHead className="w-[400px] text-muted-foreground ps-6">
                    <div className="inline-flex items-center gap-1.5">
                      <Bell className="text-muted-foreground size-3.5" />
                      Notification
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Users className="text-muted-foreground size-3.5" />
                      Users
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <MailWarning className="text-muted-foreground size-3.5" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center text-muted-foreground pe-6">
                    <div className="inline-flex items-center gap-1.5">
                      <AppWindowMac className="text-muted-foreground size-3.5" />
                      Web
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationSettings.map(
                  ({
                    label,
                    description,
                    emailField,
                    webField,
                    roleIdsField,
                  }) => (
                    <TableRow key={label}>
                      <TableCell className="ps-6">
                        <div className="space-y-1">
                          <div className="text-md font-semibold">{label}</div>
                          <div className="text-muted-foreground font-2sm font-regular">
                            {description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                mode="icon"
                                className="h-7! w-7!"
                              >
                                <UserPlus className="size-3.5!" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[200px] p-0"
                              align="start"
                              side="bottom"
                            >
                              <Command>
                                <CommandInput placeholder="Search roles..." />
                                <CommandList>
                                  <CommandEmpty>No roles found.</CommandEmpty>
                                  <CommandGroup>
                                    <ScrollArea>
                                      {roles?.map((role) => {
                                        const isSelected = (
                                          form.watch(
                                            roleIdsField as keyof NotificationSettingsSchemaType,
                                          ) as string[]
                                        ).includes(role.id);
                                        return (
                                          <CommandItem
                                            key={role.id}
                                            onSelect={() =>
                                              toggleRoleSelection(
                                                roleIdsField as keyof NotificationSettingsSchemaType,
                                                role.id,
                                              )
                                            }
                                          >
                                            <span className="grow">
                                              {role.name}
                                            </span>
                                            {isSelected && <CommandCheck />}
                                          </CommandItem>
                                        );
                                      })}
                                    </ScrollArea>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <div className="flex items-center flex-wrap gap-2">
                            {(
                              form.watch(
                                roleIdsField as keyof NotificationSettingsSchemaType,
                              ) as string[]
                            )?.length > 0 ? (
                              (
                                form.watch(
                                  roleIdsField as keyof NotificationSettingsSchemaType,
                                ) as string[]
                              ).map((roleId) => {
                                const role = roles.find((r) => r.id === roleId);
                                return (
                                  <Badge key={roleId} variant="secondary">
                                    {role?.name}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground">
                                Not set
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center pe-2!">
                        <FormField
                          control={form.control}
                          name={
                            emailField as keyof NotificationSettingsSchemaType
                          }
                          render={({ field }) => (
                            <FormItem className="items-center">
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center pe-6!">
                        <FormField
                          control={form.control}
                          name={
                            webField as keyof NotificationSettingsSchemaType
                          }
                          render={({ field }) => (
                            <FormItem className="items-center">
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 py-5 px-10">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <LoaderCircleIcon className="animate-spin" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </Form>
    </form>
  );
};

export default NotificationSettingsPage;
