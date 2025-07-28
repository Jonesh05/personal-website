import { db } from '../lib/firebase';
import { Post } from 'shared/types/post.types';
import { adminDb } from '../db/firebaseAdmin';

/*export async function getAllPosts(): Promise<Post[]> {
  const snapshot = await db.collection('posts').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];
} */
export class PostsService {
  private collection = adminDb.collection('posts');

  // Obtener todos los posts con filtros
  async getPosts(filters: {
    published?: boolean;
    tag?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ posts: Post[]; total: number }> {
    try {
      let query = this.collection.orderBy('createdAt', 'desc');

      // Aplicar filtros
      if (filters.published !== undefined) {
        query = query.where('published', '==', filters.published);
      }

      if (filters.tag) {
        query = query.where('tags', 'array-contains', filters.tag);
      }

      if (filters.authorId) {
        query = query.where('authorId', '==', filters.authorId);
      }

      // Paginación
      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const posts: Post[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Post);
      });

      // Obtener total count (simplificado)
      const totalSnapshot = await this.collection.count().get();
      const total = totalSnapshot.data().count;

      return { posts, total };
    } catch (error) {
      console.error('Error obteniendo posts:', error);
      throw new Error('Error al obtener posts');
    }
  }

  async getPostById(id: string): Promise<Post | null> {
    const doc = await db.collection('posts').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Post;
  }

  // Obtener post por slug
  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      const snapshot = await this.collection
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Post;
    } catch (error) {
      console.error('Error obteniendo post por slug:', error);
      throw new Error('Error al obtener post');
    }
  }

  // Crear nuevo post
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    try {
      // Validar slug único
      const existingPost = await this.getPostBySlug(postData.slug);
      if (existingPost) {
        throw new Error('Ya existe un post con este slug');
      }

      const now = new Date();
      const newPost = {
        ...postData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.collection.add(newPost);

      return {
        id: docRef.id,
        ...newPost,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    } catch (error) {
      console.error('Error creando post:', error);
      throw error;
    }
  }

  // Actualizar post
  async updatePost(id: string, updateData: Partial<Post>): Promise<Post> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Post no encontrado');
      }

      // Si se actualiza el slug, verificar que sea único
      if (updateData.slug) {
        const existingPost = await this.getPostBySlug(updateData.slug);
        if (existingPost && existingPost.id !== id) {
          throw new Error('Ya existe un post con este slug');
        }
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
      };

      await docRef.update(updatedData);

      // Obtener el documento actualizado
      const updatedDoc = await docRef.get();
      const data = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Post;
    } catch (error) {
      console.error('Error actualizando post:', error);
      throw error;
    }
  }

  // Eliminar post
  async deletePost(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Post no encontrado');
      }

      await docRef.delete();
    } catch (error) {
      console.error('Error eliminando post:', error);
      throw error;
    }
  }

  // Generar slug único basado en el título
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno
      .trim();
  }
}

// Singleton instance
export const postsService = new PostsService();
