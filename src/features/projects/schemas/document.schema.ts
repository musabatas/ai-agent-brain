import { z } from 'zod';

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z
    .enum(['NOTE', 'SPEC', 'GUIDE', 'RUNBOOK', 'REFERENCE'])
    .default('NOTE'),
  tags: z.array(z.string().max(50)).default([]),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateDocumentSchemaType = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['NOTE', 'SPEC', 'GUIDE', 'RUNBOOK', 'REFERENCE']).optional(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateDocumentSchemaType = z.infer<typeof UpdateDocumentSchema>;
