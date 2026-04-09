import { z } from 'zod';

export const SocialSettingsSchema = z.object({
  socialFacebook: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: 'Invalid URL',
    }),
  socialTwitter: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: 'Invalid URL',
    }),
  socialInstagram: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: 'Invalid URL',
    }),
  socialLinkedIn: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: 'Invalid URL',
    }),
  socialPinterest: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: 'Invalid URL',
    }),
  socialYoutube: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: 'Invalid URL',
    }),
});

export type SocialSettingsSchemaType = z.infer<typeof SocialSettingsSchema>;
