// frontend/src/lib/firestore/projects.ts
// Server-side Firestore data access layer for projects
// NEVER import this file in client components

import { adminDb } from '@/lib/firebase/admin'
import type { CreateProjectInput, UpdateProjectInput } from '@personal-website/shared/schemas/project.schema'

const COLLECTION = 'projects'

export interface Project {
  id: string
  title: string
  description: string
  image: string
  technologies: string[]
  category: 'web' | 'blockchain' | 'ai' | 'cloud'
  status: 'completed' | 'in-progress' | 'planned'
  links: {
    live?: string
    github?: string
    demo?: string
  }
  featured: boolean
  year: number
  order: number
  createdAt: Date | string
  updatedAt: Date | string
}

interface ProjectFilters {
  category?: string
  status?: string
  featured?: boolean
  limit?: number
}

export async function getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  let query = adminDb.collection(COLLECTION).orderBy('order', 'asc')

  if (filters.category) {
    query = query.where('category', '==', filters.category)
  }
  if (filters.status) {
    query = query.where('status', '==', filters.status)
  }
  if (filters.featured !== undefined) {
    query = query.where('featured', '==', filters.featured)
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Project
  })
}

export async function getProjectById(id: string): Promise<Project | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Project
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  return getProjects({ featured: true, limit })
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const now = new Date()
  const projectData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }

  const ref = await adminDb.collection(COLLECTION).add(projectData)
  return {
    id: ref.id,
    ...projectData,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export async function updateProject(id: string, data: UpdateProjectInput): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date(),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete()
}

export async function getProjectCategories(): Promise<string[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .select('category')
    .get()

  const categories = new Set<string>()
  snapshot.docs.forEach(doc => {
    const category = doc.data().category
    if (category) categories.add(category)
  })

  return Array.from(categories)
}
