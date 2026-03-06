import { z } from 'zod'

export const LinksSchema = z.object({
  live: z.string().url().optional().or(z.literal('')).default(''),
  github: z.string().url().optional().or(z.literal('')).default(''),
  demo: z.string().url().optional().or(z.literal('')).default(''),
})

export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(1000),
  image: z.string().url().optional().or(z.literal('')).default(''),
  technologies: z.array(z.string().min(1).max(100)).default([]),
  category: z.enum(['web', 'blockchain', 'ai', 'cloud']),
  status: z.enum(['completed', 'in-progress', 'planned']),
  links: LinksSchema.optional().default({ live: '', github: '', demo: '' }),
  featured: z.boolean().optional().default(false),

  year: z.coerce.number().int().min(2020).max(2030),
  order: z.number().default(0),
  createdAt: z.coerce.number().optional(),
  updatedAt: z.coerce.number().optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>