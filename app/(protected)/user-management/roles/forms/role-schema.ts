import { z } from 'zod';

export const RoleSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Role name must be at least 2 characters long.' }),
  slug: z
    .string()
    .min(2, { message: 'Slug must be at least 2 characters long.' }),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export type RoleSchemaType = z.infer<typeof RoleSchema>;
