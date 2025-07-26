import { db } from '../lib/firebase';
import { Post } from 'shared/types/post.types';

export async function getAllPosts(): Promise<Post[]> {
  const snapshot = await db.collection('posts').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];
}

export async function getPostById(id: string): Promise<Post | null> {
  const doc = await db.collection('posts').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Post;
} 