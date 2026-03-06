# SKILL.md — Portfolio & Blog Platform Development Guide

> **Last updated:** 2026-02-28
> **Status:** Planning phase

---

## 1. Project Overview

| Field        | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| **Type**     | Portfolio website with integrated blog and admin dashboard            |
| **Purpose**  | Showcase projects, publish blog posts, demonstrate technical skills   |
| **Target**   | Single admin author (`newrevolutiion@gmail.com`), public readers      |
| **Repo root**| `personal-website/` (pnpm monorepo)                                  |
| **Workspaces**| `frontend/`, `backend/`, `functions/`, `shared/`                    |

---

## 2. Tech Stack & Versions

### 2.1 Core Framework

| Package       | Target Version | Purpose                              |
|--------------|----------------|--------------------------------------|
| Next.js       | 16+            | App Router, RSC, Server Actions      |
| React         | 19+            | Server Components, Server Actions    |
| TypeScript    | 5.7+ (strict)  | Type safety throughout               |
| Node.js       | 22+ LTS        | Runtime for backend & build          |

### 2.2 Backend & Database

| Package              | Target Version | Purpose                                    |
|---------------------|----------------|--------------------------------------------|
| Firebase Admin SDK   | 13+            | **Server-side only** — Firestore, Auth (session cookies), Storage |
| Firebase Client SDK  | 11+            | **Client-side auth popup only** — NO Firestore on client          |
| Firebase Functions   | 6+             | Cloud Functions (Express API)              |

### 2.3 UI & Styling

| Package       | Target Version | Purpose                              |
|--------------|----------------|--------------------------------------|
| Tailwind CSS  | 4.0+           | Utility-first styling                |
| Headless UI   | 2.2+           | Accessible unstyled components       |

**Banned UI libraries** — do NOT add or use:
- ❌ shadcn/ui
- ❌ Radix UI
- ❌ lucide-react (use inline SVGs or `/public/icons/*.svg`)

### 2.4 State & Data

| Package  | Target Version | Purpose                                      |
|---------|----------------|----------------------------------------------|
| Zustand  | 5.0+           | **Minimal** — auth UI state only             |
| Zod      | Latest         | Runtime validation (shared schemas)          |
| date-fns | Latest         | Date formatting                              |

### 2.5 Animation (Keep)

| Package        | Version | Purpose                         |
|---------------|---------|--------------------------------------|
| GSAP           | 3.13+  | Hero & scroll animations (client)    |
| Framer Motion  | 12+    | Component transitions (client)       |

---

## 3. Architecture Patterns

### 3.1 Server Components (DEFAULT)

Every `.tsx` file in `src/app/` and `src/components/` is a **React Server Component** by default.

**Server Components CAN:**
- Fetch data directly (Firestore Admin SDK, `fetch()`)
- Access environment variables (non-`NEXT_PUBLIC_`)
- Render static/dynamic HTML with zero client JS
- Use `async/await` at the component level

**Server Components CANNOT:**
- Use `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`
- Use browser APIs (`window`, `document`, `localStorage`)
- Use event handlers (`onClick`, `onChange`, `onSubmit`)
- Import from `firebase/auth` or `firebase/firestore` (client SDK)

### 3.2 Client Components (Opt-in)

Add `"use client"` directive **only** when the component needs interactivity.

**Naming convention:** `ComponentName.client.tsx`

**Valid reasons for `"use client"`:**
- Form inputs / controlled state
- Click/hover/keyboard handlers
- Browser APIs (IntersectionObserver, navigator, etc.)
- Animation libraries (GSAP, Framer Motion)
- Auth popup trigger (Firebase Client SDK `signInWithPopup`)
- Zustand store consumers

**Client Component rules:**
- Keep as small as possible — extract static parts to Server Components
- Never fetch data in client components — receive data as props from Server Components
- Never import Firebase Admin SDK

### 3.3 Data Flow Pattern

```
┌─────────────────────────────────────────────────┐
│  Server Component (page.tsx)                     │
│  ┌───────────────────────────────────────┐      │
│  │ const data = await getFromFirestore() │      │
│  └───────────────────────────────────────┘      │
│           │ pass as props                        │
│           ▼                                      │
│  ┌───────────────────────────────────────┐      │
│  │ <ClientComponent data={data} />       │      │
│  │ (handles interactivity only)          │      │
│  └───────────────────────────────────────┘      │
│           │ mutations                            │
│           ▼                                      │
│  ┌───────────────────────────────────────┐      │
│  │ Server Action (use server)            │      │
│  │ → Validate with Zod                   │      │
│  │ → Write to Firestore via Admin SDK    │      │
│  │ → revalidatePath / revalidateTag      │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### 3.4 Server Actions Pattern

All data mutations go through Server Actions defined in `src/app/actions/`.

```typescript
// lib/actions/posts.ts
'use server'

import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'newrevolutiion@gmail.com'

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) return null
  
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    
    if (decoded.email !== ADMIN_EMAIL) return null
    
    return {
      uid: decoded.uid,
      email: decoded.email,
      isAdmin: true
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

export async function createPost(formData: FormData) {
  const session = await getSession()
  
  if (!session || session.email !== ADMIN_EMAIL) {
    return { 
      success: false, 
      error: 'Unauthorized. Admin access required.' 
    }
  }
  

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const excerpt = formData.get('excerpt') as string
  const tags = (formData.get('tags') as string).split(',').map(t => t.trim())
  const status = formData.get('status') as 'draft' | 'published'
  
  if (!title || !content) {
    return { 
      success: false, 
      error: 'Title and content are required' 
    }
  }
  
  try {
    const postRef = await adminDb.collection('posts').add({
      title,
      content,
      excerpt: excerpt || content.substring(0, 160),
      tags,
      status,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      author: {
        uid: session.uid,
        email: session.email,
        displayName: 'Admin'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: status === 'published' ? new Date() : null,
      views: 0,
      readTime: Math.ceil(content.split(' ').length / 200)
    })
    

    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    
    return { 
      success: true, 
      id: postRef.id 
    }
    
  } catch (error) {
    console.error('Failed to create post:', error)
    return { 
      success: false, 
      error: 'Failed to create post' 
    }
  }
}
```

---

## 4. Authentication Architecture

### 4.1 Flow Overview

```
Client                        Server (Next.js)                Firebase
──────                        ────────────────                ────────
1. Click "Sign in"
2. signInWithPopup(Google) ──────────────────────────────────► Auth
3. Get idToken             ◄──────────────────────────────────
4. POST /api/auth/login    ──►
   { idToken }                5. verifyIdToken(idToken)
                              6. Check email === admin
                              7. createSessionCookie(idToken, 7d)
                              8. Set httpOnly cookie ──────────►
9. Redirect to /admin     ◄──
   (cookie sent automatically)
```

### 4.2 Security Rules

| Rule                              | Implementation                                    |
|----------------------------------|---------------------------------------------------|
| Admin email                       | `newrevolutiion@gmail.com` (hardcoded server-side) |
| Session duration                  | 7 days via httpOnly session cookie                 |
| Token storage                     | **NEVER** in localStorage/sessionStorage           |
| idToken lifetime                  | Used once to create session, then discarded        |
| Route protection                  | Next.js middleware for `/blog/admin/*`              |
| Firestore access                  | Server-only via Admin SDK (no client Firestore)    |
| CSRF                              | SameSite=Lax cookie + origin check                 |

### 4.3 Auth Files

| File                              | Purpose                                           |
|----------------------------------|---------------------------------------------------|
| `src/lib/firebase/admin.ts`       | Firebase Admin SDK init (server only)             |
| `src/lib/firebase/client.ts`      | Firebase Client SDK init (auth popup only)        |
| `src/lib/auth/session.ts`         | Session cookie helpers (create, verify, revoke)   |
| `src/app/api/auth/login/route.ts` | POST — exchange idToken for session cookie        |
| `src/app/api/auth/logout/route.ts`| POST — clear session cookie                      |
| `src/middleware.ts`               | Protect `/admin/*` routes                         |
| `src/store/authStore.ts`          | Zustand — UI-only auth state (no tokens)          |

---

## 5. Firebase Firestore Collections

### 5.1 `posts`

```typescript
interface FirestorePost {
  title: string              // 3–200 chars
  slug: string               // unique, auto-generated
  content: string            // Markdown, min 50 chars
  excerpt: string            // max 300 chars, auto-generated if empty
  published: boolean
  featured: boolean
  tags: string[]             // max 10
  featuredImage: string      // URL or empty
  coverImage: string         // URL or empty
  authorId: string           // Firebase UID
  authorName: string
  likes: number              // default 0
  views: number              // default 0
  readingTime: number        // minutes, auto-calculated
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 5.2 `projects`

```typescript
interface FirestoreProject {
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
  order: number              // display order
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 5.3 `contacts`

```typescript
interface FirestoreContact {
  name: string
  email: string
  message: string
  read: boolean
  createdAt: Timestamp
}
```

### 5.4 `siteConfig` (single document)

```typescript
interface FirestoreSiteConfig {
  heroTitle: string
  heroSubtitle: string
  aboutText: string[]        // paragraphs
  aboutImage: string
  socialLinks: { name: string; url: string; icon: string }[]
  skills: { name: string; category: string }[]
  timeline: { year: string; title: string; description: string }[]
}
```

### 5.5 Firestore Security Rules (Target)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for published posts
    match /posts/{postId} {
      allow read: if resource.data.published == true;
      allow write: if false; // All writes via Admin SDK
    }

    // Public read for projects
    match /projects/{projectId} {
      allow read: if true;
      allow write: if false;
    }

    // Contact form — create only, no read
    match /contacts/{contactId} {
      allow create: if true;
      allow read, update, delete: if false;
    }

    // Site config — public read
    match /siteConfig/{docId} {
      allow read: if true;
      allow write: if false;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 6. Project Structure (Target)

```
personal-website/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                    # Root layout (Server Component)
│   │   │   ├── page.tsx                      # Home page (Server Component)
│   │   │   ├── globals.css
│   │   │   ├── actions/                      # Server Actions
│   │   │   │   ├── auth.ts                   # login/logout actions
│   │   │   │   ├── posts.ts                  # CRUD post actions
│   │   │   │   ├── contacts.ts               # contact form action
│   │   │   │   └── projects.ts               # CRUD project actions
│   │   │   ├── api/
│   │   │   │   └── auth/
│   │   │   │       ├── login/route.ts        # POST: idToken → session cookie
│   │   │   │       └── logout/route.ts       # POST: clear session cookie
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx                  # Blog listing (Server Component)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx              # Blog post detail (Server Component)
│   │   │   └── admin/
│   │   │       ├── layout.tsx                # Admin layout (Server Component)
│   │   │       ├── page.tsx                  # Admin dashboard
│   │   │       └── posts/
│   │   │           ├── page.tsx              # Post management
│   │   │           ├── new/page.tsx          # New post
│   │   │           └── [id]/edit/page.tsx    # Edit post
│   │   ├── components/
│   │   │   ├── Hero/
│   │   │   │   ├── Hero.tsx                  # Server Component (static content)
│   │   │   │   └── HeroAnimations.client.tsx # Client: GSAP animations
│   │   │   ├── About/
│   │   │   │   ├── About.tsx                 # Server Component
│   │   │   │   └── Terminal.client.tsx        # Client: typewriter animation
│   │   │   ├── Navbar/
│   │   │   │   ├── Navbar.tsx                # Server Component (links, logo)
│   │   │   │   └── NavbarMobile.client.tsx   # Client: mobile menu toggle
│   │   │   ├── Projects/
│   │   │   │   ├── Projects.tsx              # Server Component (fetch from Firestore)
│   │   │   │   └── ProjectFilter.client.tsx  # Client: category filter
│   │   │   ├── Blog/
│   │   │   │   ├── BlogSection.tsx           # Server Component
│   │   │   │   ├── PostCard.tsx              # Server Component
│   │   │   │   ├── InfinitePostList.client.tsx # Client: infinite scroll
│   │   │   │   ├── LikeButton.client.tsx     # Client: like interaction
│   │   │   │   └── ShareButtons.client.tsx   # Client: share interaction
│   │   │   ├── Contact/
│   │   │   │   ├── Contact.tsx               # Server Component (wrapper)
│   │   │   │   └── ContactForm.client.tsx    # Client: form state
│   │   │   ├── Auth/
│   │   │   │   ├── AdminAuthModal.client.tsx # Client: Google popup
│   │   │   │   └── SignOutButton.client.tsx  # Client: sign out
│   │   │   ├── Timeline/
│   │   │   │   └── Timeline.tsx              # Server Component
│   │   │   ├── Skills/
│   │   │   │   └── Skills.tsx                # Server Component
│   │   │   └── ui/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ApiError.tsx
│   │   ├── lib/
│   │   │   ├── firebase/
│   │   │   │   ├── admin.ts                  # Firebase Admin SDK init (SERVER ONLY)
│   │   │   │   └── client.ts                 # Firebase Client SDK init (auth only)
│   │   │   ├── auth/
│   │   │   │   └── session.ts                # Session cookie utilities
│   │   │   ├── firestore/
│   │   │   │   ├── posts.ts                  # Firestore queries for posts
│   │   │   │   ├── projects.ts               # Firestore queries for projects
│   │   │   │   ├── contacts.ts               # Firestore queries for contacts
│   │   │   │   └── siteConfig.ts             # Firestore queries for site config
│   │   │   └── validations/
│   │   │       ├── post.schema.ts            # Zod schemas for posts
│   │   │       ├── contact.schema.ts         # Zod schemas for contacts
│   │   │       └── project.schema.ts         # Zod schemas for projects
│   │   ├── store/
│   │   │   └── authStore.ts                  # Zustand — UI state only (no tokens)
│   │   ├── hooks/
│   │   │   └── useInView.ts                  # IntersectionObserver hook
│   │   ├── constants/
│   │   │   └── blog.ts                       # Blog defaults
│   │   ├── i18n/
│   │   │   └── utils.ts                      # Translation utility
│   │   ├── utils/
│   │   │   ├── validation.ts                 # Legacy validation (migrate to Zod)
│   │   │   └── seoHelper.tsx                 # SEO utilities
│   │   └── middleware.ts                      # Route protection for /admin/*
│   ├── public/
│   │   ├── icons/                            # SVG icons (replaces lucide-react)
│   │   └── images/
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── backend/                                   # Express API on Cloud Functions
├── functions/                                 # Additional Cloud Functions
├── shared/                                    # Shared types & schemas
│   ├── types/
│   │   ├── post.types.ts
│   │   ├── project.types.ts
│   │   ├── contact.types.ts
│   │   └── user.types.ts
│   └── schemas/                               # Zod schemas (shared between FE/BE)
├── firebase.json
├── firestore.rules
├── SKILL.md                                   # ← This file
└── RESTRUCTURING-PLAN.md                      # Step-by-step migration plan
```

---

## 7. Environment Variables

### 7.1 Frontend (`frontend/.env.local`)

```bash
# Firebase Client (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-only — NEVER prefix with NEXT_PUBLIC_)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# App
NEXT_PUBLIC_SITE_URL=https://your-domain.com
SESSION_COOKIE_SECRET=<random-32-char-string>
```

### 7.2 Backend (`backend/.env`)

```bash
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
ADMIN_EMAIL=newrevolutiion@gmail.com
FRONTEND_URLS=http://localhost:3000,https://your-domain.com
NODE_ENV=development
```

---

## 8. Coding Conventions

### 8.1 File Naming

| Pattern                    | Use for                              |
|---------------------------|--------------------------------------|
| `ComponentName.tsx`        | Server Components (default)          |
| `ComponentName.client.tsx` | Client Components (opt-in)           |
| `route.ts`                 | API Route Handlers                   |
| `page.tsx`                 | Page Components                      |
| `layout.tsx`               | Layout Components                    |
| `loading.tsx`              | Loading UI                           |
| `error.tsx`                | Error UI                             |
| `*.schema.ts`              | Zod validation schemas               |

### 8.2 Import Order

```typescript
// 1. React / Next.js
import { Suspense } from 'react'
import Image from 'next/image'

// 2. Third-party libraries
import { z } from 'zod'

// 3. Internal libraries
import { adminDb } from '@/lib/firebase/admin'

// 4. Components
import { PostCard } from '@/components/Blog/PostCard'

// 5. Types
import type { Post } from '@/types/post'
```

### 8.3 Component Pattern

```typescript
// Server Component (default — no directive needed)
import { getPosts } from '@/lib/firestore/posts'

export default async function BlogSection() {
  const posts = await getPosts({ published: true, limit: 4 })

  return (
    <section>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </section>
  )
}
```

```typescript
// Client Component (opt-in)
'use client'

interface LikeButtonProps {
  postId: string
  initialLikes: number
}

export function LikeButton({ postId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  // ... interaction logic
}
```

### 8.4 Error Handling

- Server Components: use `error.tsx` boundaries
- Server Actions: return `{ success: boolean; error?: string }` objects
- Client Components: try/catch with user-facing messages
- Never expose internal errors to the client

### 8.5 Performance Rules

- **No `useEffect` for data fetching** — use Server Components
- **No client-side Firestore** — all reads/writes via Admin SDK on server
- **Images**: always use `next/image` with `width`/`height`
- **Fonts**: use `next/font` (already using Inter)
- **Metadata**: export `metadata` or `generateMetadata` from pages

---

## 9. Dependencies to Remove

| Package       | Reason                                      | Replace with              |
|--------------|---------------------------------------------|---------------------------|
| lucide-react  | Banned icon library                         | Inline SVGs, `/public/icons/` |
| react-hot-toast | Unnecessary dependency                   | Custom toast or Headless UI   |
| gray-matter   | Not needed with Firestore                   | Remove                    |
| remark        | Not needed with Firestore                   | Remove                    |

---

## 10. Dependencies to Add

| Package           | Purpose                             |
|------------------|-------------------------------------|
| firebase-admin    | Server-side Firestore & Auth        |
| @headlessui/react | Accessible UI components            |
| zod               | Runtime validation                  |
| date-fns          | Date formatting                     |

---

## 11. Quick Reference — Decision Matrix

| Question                                        | Answer                                      |
|------------------------------------------------|---------------------------------------------|
| Should this component be a Server Component?    | **Yes**, unless it needs interactivity       |
| Where do I store data?                          | **Firestore** via Admin SDK (server only)    |
| How do I mutate data?                           | **Server Actions** in `src/app/actions/`     |
| Where do I validate input?                      | **Zod schemas** (shared or server-side)      |
| How do I protect admin routes?                  | **middleware.ts** checking session cookie     |
| Where do I put auth tokens?                     | **Nowhere** — httpOnly session cookie only   |
| Can I use localStorage?                         | **NO** — never for auth or persistent data   |
| Can I use Firestore client SDK?                 | **NO** — only Firebase Auth client SDK       |
| Can I add a new UI library?                     | **NO** — only Tailwind + Headless UI         |
