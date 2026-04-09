import { z } from 'zod';

export const CreateOrgSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters.')
    .max(50, 'Organization name must not exceed 50 characters.'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Slug must be lowercase alphanumeric with hyphens.',
    )
    .min(2)
    .max(50)
    .optional(),
});
export type CreateOrgSchemaType = z.infer<typeof CreateOrgSchema>;

export const UpdateOrgSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .min(2)
    .max(50)
    .optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type UpdateOrgSchemaType = z.infer<typeof UpdateOrgSchema>;

export const AddOrgMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
export type AddOrgMemberSchemaType = z.infer<typeof AddOrgMemberSchema>;

export const UpdateOrgMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});
export type UpdateOrgMemberSchemaType = z.infer<
  typeof UpdateOrgMemberSchema
>;
