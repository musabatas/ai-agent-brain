import { z } from 'zod';

export const PermissionSchema = z.object({
  name: z
    .string()
    .nonempty({ message: 'Name is required.' })
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .max(30, { message: 'Name must not exceed 30 characters.' }),
  slug: z
    .string()
    .nonempty({ message: 'Slug is required.' })
    .min(2, { message: 'Slug must be at least 2 characters long.' })
    .max(20, { message: 'Slug must not exceed 20 characters.' }),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters.' })
    .optional(),
});

export type PermissionSchemaType = z.infer<typeof PermissionSchema>;
