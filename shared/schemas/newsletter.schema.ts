import { z } from 'zod'

export const NewsletterSourceSchema = z.enum([
  'blog-sidebar',
  'footer',
  'other',
])

export type NewsletterSource = z.infer<typeof NewsletterSourceSchema>

export const NewsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(200, 'Email too long'),

  source: NewsletterSourceSchema.default('blog-sidebar'),

  // Anti-spam honeypot. Bots tend to fill every input; real users never see it.
  website: z.string().max(0).optional(),
})

export type NewsletterSubscribeInput = z.infer<typeof NewsletterSubscribeSchema>
