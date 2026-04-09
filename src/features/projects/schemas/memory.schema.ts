import { z } from 'zod';

export const UpsertMemorySchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().min(1),
  type: z.enum(['USER', 'FEEDBACK', 'PROJECT', 'REFERENCE']).default('PROJECT'),
  tags: z.array(z.string().max(50)).default([]),
  expiresAt: z.coerce.date().nullable().optional(),
});
export type UpsertMemorySchemaType = z.infer<typeof UpsertMemorySchema>;
