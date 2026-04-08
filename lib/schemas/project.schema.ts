import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .min(2)
    .max(60)
    .optional(),
});
export type CreateProjectSchemaType = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateProjectSchemaType = z.infer<typeof UpdateProjectSchema>;
