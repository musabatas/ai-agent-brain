import { z } from 'zod';

export const NotificationSettingsSchema = z.object({
  notifyStockEmail: z.boolean(),
  notifyStockWeb: z.boolean(),
  notifyStockRoleIds: z.array(z.string()),
  notifyNewOrderEmail: z.boolean(),
  notifyNewOrderWeb: z.boolean(),
  notifyNewOrderRoleIds: z.array(z.string()),
  notifyOrderStatusUpdateEmail: z.boolean(),
  notifyOrderStatusUpdateWeb: z.boolean(),
  notifyOrderStatusUpdateRoleIds: z.array(z.string()),
  notifyPaymentFailureEmail: z.boolean(),
  notifyPaymentFailureWeb: z.boolean(),
  notifyPaymentFailureRoleIds: z.array(z.string()),
  notifySystemErrorFailureEmail: z.boolean(),
  notifySystemErrorWeb: z.boolean(),
  notifySystemErrorRoleIds: z.array(z.string()),
});

export type NotificationSettingsSchemaType = z.infer<
  typeof NotificationSettingsSchema
>;
