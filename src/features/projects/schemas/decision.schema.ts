import { z } from 'zod';

export const CreateDecisionSchema = z.object({
  title: z.string().min(1).max(200),
  status: z
    .enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED'])
    .default('PROPOSED'),
  context: z.string().min(1).max(10000),
  decision: z.string().min(1).max(10000),
  alternatives: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  consequences: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateDecisionSchemaType = z.infer<typeof CreateDecisionSchema>;

export const UpdateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z
    .enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED'])
    .optional(),
  context: z.string().min(1).max(10000).optional(),
  decision: z.string().min(1).max(10000).optional(),
  alternatives: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      }),
    )
    .nullable()
    .optional(),
  consequences: z.string().max(10000).nullable().optional(),
  supersededById: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateDecisionSchemaType = z.infer<typeof UpdateDecisionSchema>;
