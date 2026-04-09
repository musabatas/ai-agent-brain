import { z } from 'zod';

export const CreateFeatureSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  plan: z.string().max(50000).optional(),
  status: z
    .enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'])
    .default('BACKLOG'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
  sortOrder: z.number().int().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateFeatureSchemaType = z.infer<typeof CreateFeatureSchema>;

export const UpdateFeatureSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  plan: z.string().max(50000).nullable().optional(),
  status: z
    .enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'])
    .optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  sortOrder: z.number().int().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateFeatureSchemaType = z.infer<typeof UpdateFeatureSchema>;
