import { z } from 'zod'

export const NewsletterSourceSchema = z.enum([
  'blog-sidebar',
  'footer',
  'other',
])

export type NewsletterSource = z.infer<typeof NewsletterSourceSchema>

export const SubscriberStatusSchema = z.enum([
  'pending',
  'active',
  'unsubscribed',
])

export type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>

export const NEWSLETTER_TAGS = [
  'web3',
  'ai',
  'cybersecurity',
  'cloud',
  'refi',
  'engineering',
] as const

export const NewsletterTagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Tag cannot be empty')
  .max(40, 'Tag too long')
  .regex(/^[a-z0-9-]+$/, 'Invalid tag format')

export const NewsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(200, 'Email too long'),

  tags: z
    .array(NewsletterTagSchema)
    .max(15, 'Too many tags')
    .default(['web3']),

  source: NewsletterSourceSchema.default('blog-sidebar'),

  // Anti-spam honeypot. Bots tend to fill every input; real users never see it.
  website: z.string().max(0).optional(),
})

export type NewsletterSubscribeInput = z.infer<typeof NewsletterSubscribeSchema>

export const MagicTokenSchema = z
  .string()
  .trim()
  .uuid('Invalid or malformed security token')

export const PreferencesUpdateSchema = z.object({
  token: MagicTokenSchema,

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(200, 'Email too long')
    .optional(),

  status: z.enum(['active', 'unsubscribed']).optional(),

  tags: z
    .array(NewsletterTagSchema)
    .max(15, 'Too many tags')
    .optional(),
})

export type PreferencesUpdateInput = z.infer<typeof PreferencesUpdateSchema>
