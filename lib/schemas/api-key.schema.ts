import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required.')
    .max(100, 'API key name must not exceed 100 characters.'),
  expiresAt: z.coerce.date().optional(),
});
export type CreateApiKeySchemaType = z.infer<typeof CreateApiKeySchema>;
