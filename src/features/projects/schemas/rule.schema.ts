import { z } from 'zod';

export const CreateRuleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  scope: z
    .enum(['GLOBAL', 'BACKEND', 'FRONTEND', 'DATABASE', 'API', 'TESTING', 'DEVOPS'])
    .default('GLOBAL'),
  enforcement: z.enum(['MUST', 'SHOULD', 'MAY']).default('SHOULD'),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().max(50)).default([]),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateRuleSchemaType = z.infer<typeof CreateRuleSchema>;

export const UpdateRuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  scope: z
    .enum(['GLOBAL', 'BACKEND', 'FRONTEND', 'DATABASE', 'API', 'TESTING', 'DEVOPS'])
    .optional(),
  enforcement: z.enum(['MUST', 'SHOULD', 'MAY']).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateRuleSchemaType = z.infer<typeof UpdateRuleSchema>;
