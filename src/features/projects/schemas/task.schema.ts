import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  featureId: z.string().uuid().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED'])
    .default('TODO'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
  sortOrder: z.number().int().optional(),
  dependsOn: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateTaskSchemaType = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  featureId: z.string().uuid().nullable().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED'])
    .optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  sortOrder: z.number().int().optional(),
  dependsOn: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateTaskSchemaType = z.infer<typeof UpdateTaskSchema>;
