import { z } from 'zod';

export const AccountProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters'),
  avatarFile: z
    .instanceof(File)
    .nullable()
    .optional()
    .refine(
      (file) => !file || file.size <= 1024 * 1024, // Ensure file is not present or <= 1MB
      { message: 'Avatar file must be smaller than 1MB' },
    )
    .refine(
      (file) =>
        !file || ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
      { message: 'Only JPG, PNG, or GIF formats are allowed' },
    ),
  avatarAction: z.string().optional(),
});

export type AccountProfileSchemaType = z.infer<typeof AccountProfileSchema>;
