import { z } from 'zod'

export const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  content: z.string().min(50, 'Content must be at least 50 characters').max(100000).trim(),
  excerpt: z.string().max(300).optional().default(''),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags').default([]),
  published: z.boolean().optional().default(false),         
  featured: z.boolean().optional().default(false),        
  featuredImage: z.string().url().optional().or(z.literal('')).default(''),
 
  createdAt: z.coerce.number().optional(),
  updatedAt: z.coerce.number().optional(),

  slug: z.string().regex(/^[a-z0-9-]+$/).max(250).optional(),
})


export const UpdatePostSchema = CreatePostSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>