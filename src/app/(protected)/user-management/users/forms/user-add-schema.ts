import { z } from 'zod';

export const UserAddSchema = z.object({
  name: z
    .string()
    .nonempty({ message: 'Name is required.' })
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .max(50, { message: 'Name must not exceed 50 characters.' }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  roleId: z.string().nonempty({
    message: 'Role ID is required.',
  }),
});

export type UserAddSchemaType = z.infer<typeof UserAddSchema>;
