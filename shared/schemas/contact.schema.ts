import { z } from 'zod'

export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name is required")
    .max(100, "Name too long")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .max(200),

  message: z
    .string()
    .min(10, "Message too short")
    .max(2000, "Message too long")
    .trim(),

  // anti spam honeypot
  website: z.string().max(0).optional(),

  // rate limit helper
  createdAt: z
    .number()
    .optional(),
})

export type ContactFormInput = z.infer<typeof ContactFormSchema>