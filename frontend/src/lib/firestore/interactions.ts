// frontend/src/lib/firestore/interactions.ts
// Server-only. Durable blog interactions (likes, views, saves) backed by
// Firestore subcollections with atomic counters.
//
// Data model
// ──────────
// posts/{postId}
//   likes: number                         // fan-in counter
//   views: number                         // fan-in counter
// posts/{postId}/likes/{visitorId}        // one doc per user-like (toggle)
//   likedAt: timestamp
// posts/{postId}/views/{visitorId}_{yyyymmdd}
//   viewedAt: timestamp                   // de-dup per visitor per UTC day
// visitors/{visitorId}/saves/{postId}
//   postSlug, postTitle, savedAt

import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

const POSTS = 'posts'
const VISITORS = 'visitors'

function todayKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// ── Likes ─────────────────────────────────────────────────────────────────
export interface LikeResult {
  liked: boolean
  likes: number
}

/**
 * Toggle the like for `postId` by `visitorId`. Runs inside a transaction so
 * the per-user doc and the aggregate counter stay consistent.
 */
export async function toggleLike(postId: string, visitorId: string): Promise<LikeResult> {
  const postRef = adminDb.collection(POSTS).doc(postId)
  const likeRef = postRef.collection('likes').doc(visitorId)

  return adminDb.runTransaction(async (tx) => {
    const [postSnap, likeSnap] = await Promise.all([tx.get(postRef), tx.get(likeRef)])
    if (!postSnap.exists) throw new Error('POST_NOT_FOUND')

    const currentLikes = Number(postSnap.data()?.likes ?? 0)
    const alreadyLiked = likeSnap.exists

    if (alreadyLiked) {
      tx.delete(likeRef)
      tx.update(postRef, { likes: FieldValue.increment(-1) })
      return { liked: false, likes: Math.max(0, currentLikes - 1) }
    }

    tx.set(likeRef, { likedAt: FieldValue.serverTimestamp() })
    tx.update(postRef, { likes: FieldValue.increment(1) })
    return { liked: true, likes: currentLikes + 1 }
  })
}

export async function hasLiked(postId: string, visitorId: string): Promise<boolean> {
  const snap = await adminDb
    .collection(POSTS)
    .doc(postId)
    .collection('likes')
    .doc(visitorId)
    .get()
  return snap.exists
}

// ── Views ─────────────────────────────────────────────────────────────────
export interface ViewResult {
  counted: boolean
  views: number
}

/**
 * Increment the view counter at most once per visitor per UTC day. Returns the
 * up-to-date view count.
 */
export async function recordView(postId: string, visitorId: string): Promise<ViewResult> {
  const postRef = adminDb.collection(POSTS).doc(postId)
  const viewRef = postRef.collection('views').doc(`${visitorId}_${todayKey()}`)

  return adminDb.runTransaction(async (tx) => {
    const [postSnap, viewSnap] = await Promise.all([tx.get(postRef), tx.get(viewRef)])
    if (!postSnap.exists) throw new Error('POST_NOT_FOUND')

    const currentViews = Number(postSnap.data()?.views ?? 0)

    if (viewSnap.exists) {
      return { counted: false, views: currentViews }
    }

    tx.set(viewRef, { viewedAt: FieldValue.serverTimestamp() })
    tx.update(postRef, { views: FieldValue.increment(1) })
    return { counted: true, views: currentViews + 1 }
  })
}

// ── Saves (bookmarks) ─────────────────────────────────────────────────────
export interface SaveResult {
  saved: boolean
}

export interface SavedPostSummary {
  postId: string
  postSlug: string
  postTitle: string
  savedAt: string
}

export async function toggleSave(
  postId: string,
  visitorId: string,
  meta: { slug: string; title: string }
): Promise<SaveResult> {
  const saveRef = adminDb.collection(VISITORS).doc(visitorId).collection('saves').doc(postId)
  const snap = await saveRef.get()

  if (snap.exists) {
    await saveRef.delete()
    return { saved: false }
  }

  await saveRef.set({
    postId,
    postSlug: meta.slug,
    postTitle: meta.title,
    savedAt: FieldValue.serverTimestamp(),
  })
  return { saved: true }
}

export async function listSavedPosts(visitorId: string): Promise<SavedPostSummary[]> {
  const snap = await adminDb
    .collection(VISITORS)
    .doc(visitorId)
    .collection('saves')
    .orderBy('savedAt', 'desc')
    .get()

  return snap.docs.map((doc) => {
    const data = doc.data()
    return {
      postId: doc.id,
      postSlug: data.postSlug ?? '',
      postTitle: data.postTitle ?? '',
      savedAt: data.savedAt?.toDate?.()?.toISOString?.() ?? '',
    }
  })
}

export async function listLikedPostIds(visitorId: string): Promise<string[]> {
  // Denormalized mirror: each like is also recorded under visitors/{id}/likes/{postId}
  const snap = await adminDb
    .collection(VISITORS)
    .doc(visitorId)
    .collection('likes')
    .get()
  return snap.docs.map((d) => d.id)
}

/**
 * Mirror a like to visitors/{id}/likes/{postId} (or remove it) — keeps a
 * cheap query path for "what posts has this visitor liked" without
 * collection-group scans. Called from the like API route.
 */
export async function mirrorLike(
  postId: string,
  visitorId: string,
  liked: boolean
): Promise<void> {
  const ref = adminDb.collection(VISITORS).doc(visitorId).collection('likes').doc(postId)
  if (liked) {
    await ref.set({ likedAt: FieldValue.serverTimestamp() })
  } else {
    await ref.delete().catch(() => {})
  }
}
