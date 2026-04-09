import { z } from 'zod';

export const UserProfileSchema = z.object({
  name: z.string().nonempty({
    message: 'Name is required.',
  }),
  roleId: z.string().nonempty({
    message: 'Role ID is required.',
  }),
  status: z.string().nonempty({
    message: 'Status is required.',
  }),
});

export type UserProfileSchemaType = z.infer<typeof UserProfileSchema>;
