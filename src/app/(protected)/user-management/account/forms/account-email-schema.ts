import { z } from 'zod';

export const AccountEmailSchema = z.object({
  email: z.string().email('Must be a valid email'),
});

export type AccountEmailSchemaType = z.infer<typeof AccountEmailSchema>;
