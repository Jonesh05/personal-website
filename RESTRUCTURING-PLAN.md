# RESTRUCTURING PLAN — Portfolio & Blog Platform

> **Created:** 2026-02-28
> **Status:** Created
> **Reference:** See `SKILL.md` for architecture decisions and conventions

---

## Table of Contents

1. [Current State Analysis](#phase-0-current-state-analysis)
2. [Phase 1: Foundation — Firebase Admin & Session Auth](#phase-1)
3. [Phase 2: Firestore Data Layer](#phase-2)
4. [Phase 3: Server Component Migration](#phase-3)
5. [Phase 4: Client Component Extraction](#phase-4)
6. [Phase 5: Admin Dashboard](#phase-5)
7. [Phase 6: Cleanup & Optimization](#phase-6)
8. [Phase 7: Security Hardening & Deployment](#phase-7)

---

<a id="phase-0-current-state-analysis"></a>
## PHASE 0: Current State Analysis

> **Verified:** 2026-02-28 — All findings confirmed via grep/file inspection

### 0.1 Monorepo Structure (VERIFIED ✅)

```
personal-website/          (pnpm workspaces — pnpm-workspace.yaml)
├── frontend/              Next.js 16, React 19.1.0, Tailwind 4.1.11
├── backend/               Express on Cloud Functions (firebase-functions v6, firebase-admin 13.4)
├── functions/             Additional Cloud Functions (mostly unused — src/index.ts is boilerplate)
├── shared/                Shared types: post.types.ts, user.types.ts (schemas/ empty)
├── package.json           Root scripts: dev, build, deploy (uses concurrently)
├── firebase.json          Hosting, functions, emulators config
├── firestore.rules        EXPIRED open-access rules
└── pnpm-workspace.yaml    Defines 4 workspace packages
```

**Admin route location:** `/blog/admin/` (NOT `/admin/`)
- `frontend/src/app/blog/admin/page.tsx` — Server Component entry
- `frontend/src/app/blog/admin/layout.tsx` — Uses `AdminRoute` client component
- `frontend/src/app/blog/admin/BlogAdminPage.client.tsx` — Main admin client component

### 0.2 Problems Identified (VERIFIED ✅ — 22 problems)

#### 🔴 Critical (Security / Data Integrity)

| # | Problem | Evidence | File(s) |
|---|---------|----------|---------|
| 1 | **Token in localStorage** — Zustand `persist` middleware stores `token` and `user` in `localStorage` via `auth-storage` key | `persist(` at line 40, storage config at lines 177-190 | `store/authStore.ts` |
| 2 | **idToken stored in state** — `token: string | null` field holds Firebase idToken persistently, passed around as prop | `token` field at line 18, stored at line 71 | `store/authStore.ts` |
| 3 | **No httpOnly session cookies** — Auth uses Bearer token in `Authorization` header for all API calls instead of httpOnly cookies | `'Authorization': \`Bearer ${token}\`` at lines 59, 94, 116, 141 | `authStore.ts`, `AdminPostsList.tsx`, `BlogAdminPage.client.tsx` |
| 4 | **Firestore security rules EXPIRED** — Rules allow ALL read/write until `2025-08-20` (already past) — database is currently open or fully locked | `allow read, write: if request.time < timestamp.date(2025, 8, 20)` at line 15 | `firestore.rules` |
| 5 | **Client Firestore writes in AdminPostEditor** — Writes directly to Firestore from client component using `addDoc`/`setDoc` | `import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore'` at line 12 | `Blog/AdminPostEditor.tsx` |
| 6 | **No middleware route protection** — Admin routes protected ONLY by client-side `AdminRoute` component (easily bypassed) | `blog/admin/layout.tsx` wraps children in `<AdminRoute>` | `Auth/AdminRoute.tsx`, `blog/admin/layout.tsx` |
| 7 | **Token passed as prop to client** — `blog/admin/page.tsx` reads `admin_token` from plain cookies and passes it as `token` prop to `BlogAdminPage.client.tsx` — token exposed in client JS bundle | `const token = cookieStore.get('admin_token')?.value` at line 9, `<BlogAdminPageClient token={token}` at line 18 | `blog/admin/page.tsx`, `BlogAdminPage.client.tsx` |
| 8 | **Unused Zustand import in server component** — `blog/admin/page.tsx` imports `useAuthStore` (line 3) but never uses it — would cause build error if not tree-shaken | `import { useAuthStore } from '../../../store/authStore'` at line 3 | `blog/admin/page.tsx` |

#### 🟠 High (Architecture / Functionality)

| # | Problem | Evidence | File(s) |
|---|---------|----------|---------|
| 9 | **Client-heavy components** — 13 files use `"use client"` directive, many unnecessarily. Hero, About, Navbar, Contact, ProjectsContainer, ProjectsPresentational all fully client | grep found 10 `"use client"` files + 3 more without directive that import client hooks | Multiple |
| 10 | **Mock/hardcoded data** — Projects uses hardcoded `PROJECTS_DATA` array with 6 fake projects and placeholder URLs (`picsum.photos`) | `const PROJECTS_DATA: ProjectsData = {` at line 17, fake URLs at lines 24, 57, 98 | `Projects/useProjects.ts` |
| 11 | **Timeline hardcoded data** — Timeline uses hardcoded array of 4 items, should come from Firestore | Static `timeline` array at line 8 | `Timeline/Timeline.tsx` |
| 12 | **All admin API calls use fetch + Bearer token** — `BlogAdminPage.client.tsx`, `AdminPostsList.tsx` make direct fetch calls to backend API with Bearer token, should be Server Actions | `fetch(\`${process.env.NEXT_PUBLIC_API_URL}/admin/posts\`)` at multiple locations | `BlogAdminPage.client.tsx:44-52`, `AdminPostsList.tsx:92-97` |
| 13 | **AdminCreatePostButton missing** — Imported in `BlogAdminPage.client.tsx` line 6 but file does not exist | `import { AdminCreatePostButton } from '@/components/Blog/AdminCreatePostButton'` — file not found | `BlogAdminPage.client.tsx` |

#### 🟡 Medium (Code Quality / Consistency)

| # | Problem | Evidence | File(s) |
|---|---------|----------|---------|
| 14 | **lucide-react usage** — Banned library imported in 2 files | `import { Terminal } from 'lucide-react'` and `import { Github, Twitter, Linkedin } from 'lucide-react'` | `About/About.tsx:5`, `hooks/useHeroData.tsx:2` |
| 15 | **react-hot-toast phantom dependency** — `toast.ts` imports `react-hot-toast` but it's NOT in `package.json` | `import toast from 'react-hot-toast'` at line 1; package.json has no `react-hot-toast` entry | `lib/toast.ts`, `frontend/package.json` |
| 16 | **API URL spread across 9+ files** — `NEXT_PUBLIC_API_URL` used inconsistently, some with `/api/` prefix, some without | grep found 17 matches across 9 files | `BlogSection.tsx`, `InfinitePostList.tsx`, `AdminPostsList.tsx`, `LikeButton.tsx`, `RelatedPosts.tsx`, `AdminPostsStats.server.tsx`, `BlogAdminPage.client.tsx`, `blog/page.tsx`, `BlogSidebar.tsx` |
| 17 | **PostCard relative import** — Uses deep relative path instead of workspace alias | `import type { Post } from '../../../../shared/types/post.types'` at line 3 | `Blog/PostCard.tsx` |
| 18 | **HeroPresentational missing `"use client"`** — Uses `framer-motion` components (`motion.div`) but has no `"use client"` directive; works only because parent `HeroContainer` is client | No directive, but imports `import { motion } from 'framer-motion'` at line 3 | `Hero/HeroPresentational.tsx` |

#### 🟢 Low (Cleanup)

| # | Problem | Evidence | File(s) |
|---|---------|----------|---------|
| 19 | **Dead code: Skills.tsx** — Entire file is commented out (54 lines wrapped in `/* */`) | File starts with `/* const Skills` and ends with `export default Skills; */` | `Skills/Skills.tsx` |
| 20 | **Dead code: Empty files** — 2 files are empty (1 byte each) | `AdminPostsStats.tsx` and `BlogPostContent.tsx` contain only whitespace | `Blog/AdminPostsStats.tsx`, `Blog/BlogPostContent.tsx` |
| 21 | **Unused i18n stub** — Translation function returns the key unchanged | `return (key: string) => key` at line 2 | `i18n/utils.ts` |
| 22 | **Mixed language** — Spanish/English mixed in UI text, comments, error messages, and component names | Throughout codebase — e.g. "Cargando proyectos", "Error al cargar", "Publicado", "Send Message" | Throughout |

### 0.3 Component Audit — Server vs Client (VERIFIED ✅)

#### Full File Inventory (38 `.tsx`/`.ts` source files)

**Pages & Layouts (6 files):**

| File | Current Type | Directive | Issues |
|------|-------------|-----------|--------|
| `app/layout.tsx` | Server | None | ✅ Correct |
| `app/page.tsx` | Server | None | ✅ Correct |
| `app/blog/page.tsx` | Server | None | Fetches via `NEXT_PUBLIC_API_URL` → migrate to Firestore |
| `app/blog/admin/page.tsx` | Server | None | Reads plain cookies, passes token to client, imports unused `useAuthStore` |
| `app/blog/admin/layout.tsx` | Server | None | Uses client `AdminRoute` for protection → replace with middleware |
| `app/blog/admin/BlogAdminPage.client.tsx` | Client | `"use client"` | Receives `token` prop, makes fetch calls with Bearer token |

**Hero (3 files):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Hero/Hero.tsx` | Client (`"use client"`) | **Split** | Extract GSAP animations to `.client.tsx`; static content stays server |
| `Hero/HeroContainer.tsx` | Client (implicit) | **DELETE** | Thin wrapper using `useHeroData` hook (which uses lucide-react) |
| `Hero/HeroPresentational.tsx` | Missing directive | **DELETE** | Uses `framer-motion` without `"use client"`; merge into new Hero split |

**About (1 file):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `About/About.tsx` | Client (`"use client"`) | **Split** | Static bio → Server; terminal typewriter → `.client.tsx` |

**Navbar (1 file):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Navbar/Navbar.tsx` | Client (`"use client"`) | **Split** | Links/logo → Server; mobile menu + scroll detection → `.client.tsx` |

**Projects (5 files):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Projects/Projects.tsx` | Server (wrapper) | **Server** (rewrite) | Currently just renders `ProjectsContainer`; rewrite to fetch from Firestore |
| `Projects/ProjectsContainer.tsx` | Client (`"use client"`) | **DELETE** | Replaced by server-side data fetch in `Projects.tsx` |
| `Projects/ProjectsPresentational.tsx` | Client (`"use client"`) | **Split** | Static cards → Server; filter buttons + GSAP → `.client.tsx` |
| `Projects/useProjects.ts` | Client (`"use client"`) | **DELETE** | Mock data hook; replaced by Firestore queries |
| `Projects/Projects.types.ts` | Types | **KEEP** (update) | Add missing fields, align with Firestore schema |

**Contact (1 file):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Contact/Contact.tsx` | Client (`"use client"`) | **Split** | Wrapper + social links → Server; form → `ContactForm.client.tsx` |

**Blog (14 files):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Blog/BlogSection.tsx` | Server | **Server** ✅ | Migrate fetch to Firestore Admin SDK |
| `Blog/BlogHeader.tsx` | Server | **Server** ✅ | No changes needed |
| `Blog/BlogBreadcrumbs.tsx` | Server | **Server** ✅ | No changes needed |
| `Blog/BlogSidebar.tsx` | Server (mixed) | **Server** ✅ | Migrate fetch to Firestore |
| `Blog/PostCard.tsx` | Server | **Server** ✅ | Fix relative import path |
| `Blog/PostCardSkeleton.tsx` | Server | **Server** ✅ | No changes needed |
| `Blog/BlogSectionSkeleton.tsx` | Server | **Server** ✅ | No changes needed |
| `Blog/RelatedPosts.tsx` | Server | **Server** ✅ | Migrate fetch to Firestore |
| `Blog/InfinitePostList.tsx` | Client (`"use client"`) | **Client** ✅ | Refactor to receive initial data as props |
| `Blog/LikeButton.tsx` | Client (`"use client"`) | **Client** ✅ | Migrate to Server Action |
| `Blog/ShareButtons.tsx` | Client (`"use client"`) | **Client** ✅ | No major changes |
| `Blog/AdminPostEditor.tsx` | Client (`"use client"`) | **Client** (refactor) | Remove Firestore client writes → Server Actions |
| `Blog/AdminPostsList.tsx` | Client (`"use client"`) | **Client** (refactor) | Remove fetch + Bearer token → Server Actions |
| `Blog/AdminPostsStats.server.tsx` | Server | **Server** (refactor) | Migrate fetch to Firestore Admin SDK |
| `Blog/AdminPostsStatsClient.tsx` | Client (`"use client"`) | **Client** ✅ | Receives stats as props — OK |
| `Blog/BlogPostContent.tsx` | Empty (1 byte) | **DELETE** | Dead code |
| `Blog/AdminPostsStats.tsx` | Empty (1 byte) | **DELETE** | Dead code |

**Auth (2 files):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Auth/AdminAuthModal.tsx` | Client (`"use client"`) | **Client** ✅ | Update to use new auth flow (popup → session cookie) |
| `Auth/AdminRoute.tsx` | Client (`"use client"`) | **DELETE** | Replace with `middleware.ts` |

**Providers (1 file):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `providers/AuthProvider.tsx` | Client (`"use client"`) | **DELETE** | No longer needed with session cookies |

**Other (6 files):**

| File | Current Type | Should Be | Action |
|------|-------------|-----------|--------|
| `Timeline/Timeline.tsx` | Server (no directive) | **Server** ✅ | Migrate hardcoded data to Firestore |
| `Skills/Skills.tsx` | Dead code (commented out) | **DELETE or REWRITE** | Entirely commented out |
| `ui/LoadingSpinner.tsx` | Server | **Server** ✅ | Keep |
| `ui/ApiError.tsx` | Server | **Server** ✅ | Keep |

**Summary counts:**
- Files with `"use client"`: **13** (10 explicit + 3 implicit via parent/hooks)
- Files to DELETE: **8** (`AdminRoute`, `AuthProvider`, `HeroContainer`, `HeroPresentational`, `useProjects`, `ProjectsContainer`, `BlogPostContent`, `AdminPostsStats.tsx`)
- Files to SPLIT: **5** (`Hero`, `About`, `Navbar`, `Contact`, `ProjectsPresentational`)
- Files to REFACTOR: **6** (`AdminPostEditor`, `AdminPostsList`, `BlogAdminPage.client`, `blog/admin/page`, `blog/admin/layout`, `AdminPostsStats.server`)
- Files OK as-is: **~19**

### 0.4 Dependency Audit (VERIFIED ✅)

**Current `frontend/package.json` dependencies:**

| Package | Installed Version | Status | Action |
|---------|------------------|--------|--------|
| `next` | 15.3.5 | ⬆️ Upgrade to 16+ | Upgrade when stable; can start on 15.3 |
| `react` | 19.1.0 | ✅ Keep | Already target version |
| `react-dom` | 19.1.0 | ✅ Keep | Already target version |
| `firebase` | ^12.0.0 | ✅ Keep | Restrict to client auth only (remove Firestore client usage) |
| `zustand` | ^4.4.0 | ⬆️ Upgrade to 5.0+ | Upgrade + remove `persist` middleware + remove `token` from state |
| `tailwindcss` | ^4.1.11 | ✅ Keep | Already target version |
| `gsap` | ^3.13.0 | ✅ Keep | Client components only |
| `framer-motion` | ^12.23.3 | ✅ Keep | Client components only; ensure `"use client"` on all files using it |
| `@tailwindcss/postcss` | ^4.1.11 | ✅ Keep | Build dependency |
| `@personal-website/shared` | workspace:* | ✅ Keep | Shared types |
| `lucide-react` | ^0.525.0 | ❌ **Remove** | Banned library — replace with inline SVGs in About.tsx, useHeroData.tsx |
| `gray-matter` | ^4.0.3 | ❌ **Remove** | Not needed — no markdown file parsing with Firestore |
| `remark` | ^14.0.2 | ❌ **Remove** | Not needed — no markdown processing with Firestore |

**Phantom dependency (imported but NOT in package.json):**

| Package | Imported In | Issue |
|---------|------------|-------|
| `react-hot-toast` | `lib/toast.ts:1` | Imported but missing from `package.json` — either builds fail or resolved from hoisted dep |

**Dependencies to ADD:**

| Package | Target Version | Purpose |
|---------|---------------|---------|
| `firebase-admin` | ^13.4.0 | Server-side Firestore & Auth (session cookies) |
| `@headlessui/react` | ^2.2.0 | Accessible UI components (only allowed UI lib) |
| `zod` | ^3.24.0 | Runtime validation schemas |
| `date-fns` | ^4.1.0 | Date formatting |

**Dev dependencies (no changes needed):**

| Package | Version | Status |
|---------|---------|--------|
| `typescript` | ^5.8.3 | ✅ Keep |
| `@svgr/webpack` | ^8.1.0 | ✅ Keep (SVG handling) |
| `@types/node` | ^20.11.0 | ✅ Keep |
| `@types/react` | 19.1.8 | ✅ Keep |
| `eslint` | ^9.31.0 | ✅ Keep |
| `eslint-config-next` | 15.3.5 | ✅ Keep |
| `postcss` | ^8.5.6 | ✅ Keep |
| `autoprefixer` | ^10.4.21 | ✅ Keep |

---

<a id="phase-1"></a>
## PHASE 1: Foundation — Firebase Admin SDK & Session Auth

### STEP 1.1: Install New Dependencies

**Purpose:** Add required packages and remove banned ones from frontend.

**Dependencies:** None (first implementation step).

**Changes to `frontend/package.json`:**

```diff
 "dependencies": {
+  "firebase-admin": "^13.4.0",
+  "@headlessui/react": "^2.2.0",
+  "zod": "^3.24.0",
+  "date-fns": "^4.1.0",
   "@personal-website/shared": "workspace:*",
   "@tailwindcss/postcss": "^4.1.11",
   "firebase": "^12.0.0",
   "framer-motion": "^12.23.3",
-  "gray-matter": "^4.0.3",
   "gsap": "^3.13.0",
-  "lucide-react": "^0.525.0",
   "next": "15.3.5",
   "react": "19.1.0",
   "react-dom": "19.1.0",
-  "remark": "^14.0.2",
-  "zustand": "^4.4.0"
+  "zustand": "^5.0.0"
 }
```

**Validation:**
- `pnpm install` succeeds
- `pnpm run build --workspace=frontend` succeeds (may have type errors — fix in later steps)

---

### STEP 1.2: Create Firebase Admin SDK Initialization (Server-Only)

**Purpose:** Initialize Firebase Admin SDK for server-side Firestore and Auth operations. This file must NEVER be imported in client components.

**File to CREATE:** `frontend/src/lib/firebase/admin.ts`

**Code skeleton:**

```typescript
// frontend/src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const adminApp = getAdminApp()

export const adminDb: Firestore = getFirestore(adminApp)
export const adminAuth: Auth = getAuth(adminApp)
```

**Environment variables needed in `frontend/.env.local`:**

```bash
FIREBASE_PROJECT_ID=portfolio-website-668ce
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@portfolio-website-668ce.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Validation:**
- File only uses `firebase-admin/*` imports
- No `NEXT_PUBLIC_` prefix on Admin SDK env vars
- Test: import in a Server Component and call `adminDb.collection('test').get()`

---

### STEP 1.3: Refactor Firebase Client SDK (Auth-Only)

**Purpose:** Ensure client SDK is used ONLY for `signInWithPopup`. Remove any Firestore client imports.

**File to MODIFY:** `frontend/src/lib/firebase/client.ts` (rename from `firebaseClient.ts`)

**Current file:** `frontend/src/lib/firebaseClient.ts`

**Changes:**
1. Move to `frontend/src/lib/firebase/client.ts`
2. Remove commented-out Firestore import
3. Export only `app` and `auth`

**Code skeleton:**

```typescript
// frontend/src/lib/firebase/client.ts
'use client'

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)

export { app, auth }
// NO Firestore exports — all Firestore access is via Admin SDK on server
```

**Files to UPDATE (import path):**
- `frontend/src/store/authStore.ts` — change `@/lib/firebaseClient` → `@/lib/firebase/client`
- `frontend/src/components/Auth/AdminAuthModal.tsx` — if it imports directly

**File to DELETE:** `frontend/src/lib/firebaseClient.ts` (after migration)

**Validation:**
- `grep -r "firebaseClient" frontend/src/` returns zero results
- `grep -r "getFirestore" frontend/src/lib/firebase/client.ts` returns zero results
- `grep -r "firebase/firestore" frontend/src/` returns only `admin.ts` or zero results

---

### STEP 1.4: Create Session Cookie Utilities

**Purpose:** Server-side utilities to create, verify, and revoke httpOnly session cookies. Replaces localStorage token storage.

**File to CREATE:** `frontend/src/lib/auth/session.ts`

**Code skeleton:**

```typescript
// frontend/src/lib/auth/session.ts
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

const SESSION_COOKIE_NAME = '__session'
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const ADMIN_EMAIL = 'newrevolutiion@gmail.com'

export async function createSessionCookie(idToken: string): Promise<string> {
  // Verify the idToken first
  const decoded = await adminAuth.verifyIdToken(idToken)

  // Check if user is admin
  if (decoded.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized: not an admin')
  }

  // Create session cookie
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  })

  return sessionCookie
}

export async function verifySessionCookie() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    if (decoded.email !== ADMIN_EMAIL) return null
    return decoded
  } catch {
    return null
  }
}

export async function getSessionUser() {
  const decoded = await verifySessionCookie()
  if (!decoded) return null

  return {
    uid: decoded.uid,
    email: decoded.email!,
    displayName: decoded.name || '',
    isAdmin: decoded.email === ADMIN_EMAIL,
  }
}

export async function revokeSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decoded.uid)
    } catch {
      // Cookie already invalid, proceed with deletion
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}
```

**Validation:**
- No `NEXT_PUBLIC_` vars used
- Only `firebase-admin` imports
- `cookies()` from `next/headers` (server only)

---

### STEP 1.5: Create Auth API Routes

**Purpose:** HTTP endpoints to exchange idToken for session cookie and to log out.

**File to CREATE:** `frontend/src/app/api/auth/login/route.ts`

```typescript
// frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie } from '@/lib/auth/session'

const SESSION_COOKIE_NAME = '__session'
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const sessionCookie = await createSessionCookie(idToken)

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_SECONDS,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
```

**File to CREATE:** `frontend/src/app/api/auth/logout/route.ts`

```typescript
// frontend/src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { revokeSession } from '@/lib/auth/session'

const SESSION_COOKIE_NAME = '__session'

export async function POST() {
  try {
    await revokeSession()

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
```

**Validation:**
- `POST /api/auth/login` with valid idToken returns 200 + sets cookie
- `POST /api/auth/logout` clears cookie
- Invalid/non-admin idToken returns 401

---

### STEP 1.6: Create Next.js Middleware for Admin Route Protection

**Purpose:** Server-side route protection. Replaces client-side `AdminRoute` component.

**File to CREATE:** `frontend/src/middleware.ts`

```typescript
// frontend/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = '__session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /blog/admin/* routes (current admin location)
  if (pathname.startsWith('/blog/admin')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      // Redirect to blog page with login prompt
      const loginUrl = new URL('/blog?login=required', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Note: Full session verification happens in the page Server Component
    // Middleware only checks cookie existence for fast redirect
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/blog/admin/:path*'],
}
```

**Validation:**
- Accessing `/blog/admin` without session cookie → redirect to `/blog?login=required`
- Accessing `/blog/admin` with session cookie → proceeds to page
- Non-admin routes unaffected

> **Note:** Admin routes currently live at `app/blog/admin/`. If routes are later moved to `app/admin/`, update the matcher accordingly.

---

### STEP 1.7: Refactor Auth Store (Remove Token Persistence)

**Purpose:** Strip Zustand auth store down to UI-only state. Remove `persist` middleware, remove `token` field, remove `verifyAdmin`. Auth state comes from session cookie (server-side).

**File to MODIFY:** `frontend/src/store/authStore.ts`

**Key changes:**
1. Remove `persist` middleware import and usage
2. Remove `token` field from state
3. Remove `verifyAdmin` action
4. `signInWithGoogle` → call popup, get idToken, POST to `/api/auth/login`, discard idToken
5. `signOut` → POST to `/api/auth/logout`, then `firebaseSignOut`
6. Remove `initialize` (no more `onAuthStateChanged` listener for admin check)

**Code skeleton:**

```typescript
// frontend/src/store/authStore.ts
'use client'

import { create } from 'zustand'
import { auth } from '@/lib/firebase/client'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'

interface AuthState {
  isAdmin: boolean
  loading: boolean
  error: string | null
  displayName: string | null
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()((set) => ({
  isAdmin: false,
  loading: false,
  error: null,
  displayName: null,

  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')

      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      // Exchange idToken for httpOnly session cookie
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      // idToken is NOT stored — session cookie handles auth from here
      set({
        isAdmin: true,
        loading: false,
        displayName: result.user.displayName,
        error: null,
      })
    } catch (error) {
      console.error('Auth error:', error)
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false,
        isAdmin: false,
        displayName: null,
      })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await firebaseSignOut(auth)
      set({ isAdmin: false, loading: false, displayName: null, error: null })
    } catch (error) {
      console.error('Sign out error:', error)
      set({ error: 'Sign out failed', loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
```

**Files to DELETE after this step:**
- `frontend/src/components/Auth/AdminRoute.tsx` (replaced by middleware)
- `frontend/src/components/providers/AuthProvider.tsx` (no longer needed)

**Validation:**
- `grep -r "localStorage" frontend/src/` returns zero results
- `grep -r "persist" frontend/src/store/` returns zero results
- `grep -r "token:" frontend/src/store/` returns zero results
- Auth flow: popup → idToken → POST /api/auth/login → cookie set → idToken discarded

---

<a id="phase-2"></a>
## PHASE 2: Firestore Data Layer (Server-Side)

### STEP 2.1: Create Zod Validation Schemas

**Purpose:** Shared validation schemas for all data types. Used in Server Actions and API routes.

**File to CREATE:** `frontend/src/lib/validations/post.schema.ts`

```typescript
import { z } from 'zod'

export const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().max(300).optional().default(''),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags').default([]),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  featuredImage: z.string().url().optional().or(z.literal('')).default(''),
})

export const UpdatePostSchema = CreatePostSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
```

**File to CREATE:** `frontend/src/lib/validations/contact.schema.ts`

```typescript
import { z } from 'zod'

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export type ContactFormInput = z.infer<typeof ContactFormSchema>
```

**File to CREATE:** `frontend/src/lib/validations/project.schema.ts`

```typescript
import { z } from 'zod'

export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  image: z.string().url().optional().or(z.literal('')).default(''),
  technologies: z.array(z.string()).default([]),
  category: z.enum(['web', 'blockchain', 'ai', 'cloud']),
  status: z.enum(['completed', 'in-progress', 'planned']),
  links: z.object({
    live: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    demo: z.string().url().optional().or(z.literal('')),
  }).default({}),
  featured: z.boolean().default(false),
  year: z.number().min(2020).max(2030),
  order: z.number().default(0),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
```

**Validation:**
- All schemas export both schema objects and TypeScript types
- Zod `.parse()` throws on invalid input

---

### STEP 2.2: Create Firestore Query Functions

**Purpose:** Server-side data access layer. All Firestore reads/writes go through these functions. Never called from client components.

**File to CREATE:** `frontend/src/lib/firestore/posts.ts`

```typescript
// frontend/src/lib/firestore/posts.ts
import { adminDb } from '@/lib/firebase/admin'
import type { CreatePostInput, UpdatePostInput } from '@/lib/validations/post.schema'

const COLLECTION = 'posts'

interface PostFilters {
  published?: boolean
  featured?: boolean
  tag?: string
  limit?: number
  offset?: number
}

export async function getPosts(filters: PostFilters = {}) {
  let query = adminDb.collection(COLLECTION).orderBy('createdAt', 'desc')

  if (filters.published !== undefined) {
    query = query.where('published', '==', filters.published)
  }
  if (filters.featured !== undefined) {
    query = query.where('featured', '==', filters.featured)
  }
  if (filters.tag) {
    query = query.where('tags', 'array-contains', filters.tag)
  }
  if (filters.offset) {
    // For offset-based pagination with Firestore, use startAfter with a cursor
    // Simplified: use limit only for now
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getPostBySlug(slug: string) {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

export async function getPostById(id: string) {
  const doc = await adminDb.collection(COLLECTION).doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}

export async function createPost(data: CreatePostInput & { authorId: string; authorName: string; slug: string }) {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    likes: 0,
    views: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return { id: ref.id, ...data }
}

export async function updatePost(id: string, data: UpdatePostInput) {
  await adminDb.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date(),
  })
}

export async function deletePost(id: string) {
  await adminDb.collection(COLLECTION).doc(id).delete()
}

export async function getPopularTags(): Promise<string[]> {
  // Aggregate tags from published posts
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('published', '==', true)
    .select('tags')
    .get()

  const tagCounts = new Map<string, number>()
  snapshot.docs.forEach(doc => {
    const tags = doc.data().tags || []
    tags.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)
}
```

**File to CREATE:** `frontend/src/lib/firestore/projects.ts`

```typescript
// frontend/src/lib/firestore/projects.ts
import { adminDb } from '@/lib/firebase/admin'

const COLLECTION = 'projects'

export async function getProjects(filters: { category?: string; featured?: boolean } = {}) {
  let query = adminDb.collection(COLLECTION).orderBy('order', 'asc')

  if (filters.category && filters.category !== 'all') {
    query = query.where('category', '==', filters.category)
  }
  if (filters.featured !== undefined) {
    query = query.where('featured', '==', filters.featured)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```

**File to CREATE:** `frontend/src/lib/firestore/contacts.ts`

```typescript
// frontend/src/lib/firestore/contacts.ts
import { adminDb } from '@/lib/firebase/admin'
import type { ContactFormInput } from '@/lib/validations/contact.schema'

const COLLECTION = 'contacts'

export async function createContact(data: ContactFormInput) {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    read: false,
    createdAt: new Date(),
  })
  return ref.id
}

export async function getContacts() {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```

**File to CREATE:** `frontend/src/lib/firestore/siteConfig.ts`

```typescript
// frontend/src/lib/firestore/siteConfig.ts
import { adminDb } from '@/lib/firebase/admin'

const COLLECTION = 'siteConfig'
const DOC_ID = 'main'

export async function getSiteConfig() {
  const doc = await adminDb.collection(COLLECTION).doc(DOC_ID).get()
  if (!doc.exists) return null
  return doc.data()
}
```

**Validation:**
- All functions use `adminDb` (Firebase Admin)
- No client SDK imports
- Can be imported in Server Components and Server Actions

---

### STEP 2.3: Create Server Actions

**Purpose:** Server-side mutation functions called from client components via `useFormAction` or direct invocation.

**File to CREATE:** `frontend/src/app/actions/posts.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { CreatePostSchema, UpdatePostSchema } from '@/lib/validations/post.schema'
import * as postsDb from '@/lib/firestore/posts'
import { sanitizeSlug } from '@/utils/validation'

export async function createPostAction(formData: FormData) {
  const user = await getSessionUser()
  if (!user?.isAdmin) return { error: 'Unauthorized' }

  const raw = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    excerpt: (formData.get('excerpt') as string) || '',
    tags: JSON.parse((formData.get('tags') as string) || '[]'),
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    featuredImage: (formData.get('featuredImage') as string) || '',
  }

  const parsed = CreatePostSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const slug = sanitizeSlug(parsed.data.title)
  await postsDb.createPost({
    ...parsed.data,
    slug,
    authorId: user.uid,
    authorName: user.displayName,
  })

  revalidatePath('/blog')
  revalidatePath('/admin/posts')
  return { success: true }
}

export async function updatePostAction(id: string, formData: FormData) {
  const user = await getSessionUser()
  if (!user?.isAdmin) return { error: 'Unauthorized' }

  const raw = Object.fromEntries(formData.entries())
  if (raw.tags) raw.tags = JSON.parse(raw.tags as string)
  if (raw.published) raw.published = raw.published === 'true'
  if (raw.featured) raw.featured = raw.featured === 'true'

  const parsed = UpdatePostSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await postsDb.updatePost(id, parsed.data)

  revalidatePath('/blog')
  revalidatePath(`/blog/${raw.slug || ''}`)
  revalidatePath('/admin/posts')
  return { success: true }
}

export async function deletePostAction(id: string) {
  const user = await getSessionUser()
  if (!user?.isAdmin) return { error: 'Unauthorized' }

  await postsDb.deletePost(id)

  revalidatePath('/blog')
  revalidatePath('/admin/posts')
  return { success: true }
}
```

**File to CREATE:** `frontend/src/app/actions/contacts.ts`

```typescript
'use server'

import { ContactFormSchema } from '@/lib/validations/contact.schema'
import * as contactsDb from '@/lib/firestore/contacts'

export async function submitContactAction(formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    message: formData.get('message') as string,
  }

  const parsed = ContactFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await contactsDb.createContact(parsed.data)
  return { success: true }
}
```

**Validation:**
- All actions start with `'use server'`
- All actions verify session before mutations
- All actions validate with Zod before Firestore writes
- All actions call `revalidatePath` after mutations

---

<a id="phase-3"></a>
## PHASE 3: Server Component Migration

### STEP 3.1: Migrate Hero Component

**Purpose:** Split Hero into Server Component (static content) + Client Component (GSAP animations).

**Current:** `frontend/src/components/Hero/Hero.tsx` — fully client (`"use client"`)

**Target:**

| File | Type | Contents |
|------|------|----------|
| `Hero/Hero.tsx` | Server Component | Static HTML structure, text, links |
| `Hero/HeroAnimations.client.tsx` | Client Component | GSAP animations, refs, ScrollTrigger |

**Migration notes:**
- Move all `useRef`, `useEffect`, GSAP code to `HeroAnimations.client.tsx`
- `Hero.tsx` renders the static markup and wraps animated parts with `<HeroAnimations>`
- The client component receives children and applies animations to them

**Validation:**
- Hero renders without JavaScript (static text visible in SSR HTML)
- Animations still work when JS loads

---

### STEP 3.2: Migrate About Component

**Purpose:** Split About into Server (bio content) + Client (terminal typewriter).

**Current:** `frontend/src/components/About/About.tsx` — fully client, imports `lucide-react`

**Target:**

| File | Type | Contents |
|------|------|----------|
| `About/About.tsx` | Server Component | Static bio text, image, skill badges |
| `About/Terminal.client.tsx` | Client Component | Typewriter animation, cursor blink |

**Additional changes:**
- Remove `import { Terminal } from 'lucide-react'` — replace with inline SVG
- Static bio text rendered server-side (zero client JS)

---

### STEP 3.3: Migrate Navbar Component

**Purpose:** Split Navbar into Server (links, logo) + Client (mobile menu toggle, scroll direction).

**Current:** `frontend/src/components/Navbar/Navbar.tsx` — fully client

**Target:**

| File | Type | Contents |
|------|------|----------|
| `Navbar/Navbar.tsx` | Server Component | Nav links, logo, social links, desktop layout |
| `Navbar/NavbarMobile.client.tsx` | Client Component | Mobile menu toggle, scroll hide/show, Escape key |

**Migration notes:**
- `navLinks` and `socialLinks` arrays are static — define in Server Component
- Pass them as props to client component for mobile menu rendering
- `useScrollDirection` hook stays in client component

---

### STEP 3.4: Migrate Projects Component

**Purpose:** Replace hardcoded mock data with Firestore queries. Split into Server (data fetch + cards) + Client (category filter).

**Current:** `useProjects.ts` has hardcoded `PROJECTS_DATA` with 6 fake projects

**Target:**

| File | Type | Contents |
|------|------|----------|
| `Projects/Projects.tsx` | Server Component | Fetch from Firestore, render project cards |
| `Projects/ProjectFilter.client.tsx` | Client Component | Category filter buttons |

**Files to DELETE:**
- `Projects/useProjects.ts` (mock data)
- `Projects/ProjectsContainer.tsx` (client wrapper)

**Migration notes:**
- Projects data comes from `getProjects()` in `lib/firestore/projects.ts`
- Categories derived from data: `[...new Set(projects.map(p => p.category))]`
- Filter interaction handled client-side with URL search params or client state

---

### STEP 3.5: Migrate Contact Component

**Purpose:** Split into Server wrapper + Client form. Replace fake `setTimeout` submission with Server Action.

**Current:** `Contact.tsx` — fully client, fake submit

**Target:**

| File | Type | Contents |
|------|------|----------|
| `Contact/Contact.tsx` | Server Component | Section wrapper, heading, social links |
| `Contact/ContactForm.client.tsx` | Client Component | Form inputs, state, calls `submitContactAction` |

**Migration notes:**
- Form uses `useFormAction` or calls `submitContactAction` Server Action
- Success/error messages displayed client-side
- Social links are static — rendered server-side

---

### STEP 3.6: Migrate Blog Components

**Purpose:** Ensure blog pages use Firestore via Admin SDK instead of `fetch()` to external API.

**Current state:** `BlogSection.tsx` is already a Server Component but fetches from `process.env.NEXT_PUBLIC_API_URL`

**Target changes:**

| File | Change |
|------|--------|
| `Blog/BlogSection.tsx` | Replace `fetch()` with `getPosts()` from `lib/firestore/posts.ts` |
| `Blog/PostCard.tsx` | Keep as Server Component |
| `Blog/BlogSidebar.tsx` | Replace `fetch()` calls with Firestore query functions |
| `Blog/InfinitePostList.tsx` | Keep as Client Component — receives `initialPosts` from server |
| `Blog/AdminPostEditor.tsx` | Remove direct Firestore writes, use Server Actions instead |
| `app/blog/page.tsx` | Replace `fetch()` with `getPosts()` from `lib/firestore/posts.ts` |

**Key migration in `AdminPostEditor.tsx`:**
- Remove `import { db } from '@/lib/firebaseClient'`
- Remove `import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore'`
- Replace direct Firestore calls with `createPostAction` / `updatePostAction` Server Actions

---

<a id="phase-4"></a>
## PHASE 4: Client Component Cleanup

### STEP 4.1: Remove lucide-react Usage

**Files to modify:**
- `About/About.tsx` → replace `<Terminal className="w-4 h-4" />` with inline SVG
- `hooks/useHeroData.tsx` → replace `Github`, `Twitter`, `Linkedin` imports with inline SVGs or `/public/icons/*.svg`

**Then:** Remove `lucide-react` from `package.json`

**Validation:** `grep -r "lucide-react" frontend/src/` returns zero

---

### STEP 4.2: Remove/Replace react-hot-toast

**Current:** `lib/toast.ts` imports `react-hot-toast` (not in package.json — likely broken)

**Options:**
1. Create a simple custom toast using Headless UI `Transition`
2. Or use native browser `alert()` for admin-only notifications

**File to MODIFY:** `frontend/src/lib/toast.ts` — rewrite without react-hot-toast

---

### STEP 4.3: Remove Unused Files

| File | Reason |
|------|--------|
| `components/Auth/AdminRoute.tsx` | Replaced by `middleware.ts` |
| `components/providers/AuthProvider.tsx` | No longer needed (no `onAuthStateChanged`) |
| `components/Hero/HeroContainer.tsx` | Replaced by new Hero split |
| `components/Hero/HeroPresentational.tsx` | Replaced by new Hero split |
| `components/Blog/AdminPostsStats.tsx` | Empty file (0 bytes) |
| `components/Blog/BlogPostContent.tsx` | Empty file (0 bytes) |
| `hooks/useHeroData.tsx` | Uses lucide-react, replace with static data in Server Component |
| `lib/firebaseClient.ts` | Moved to `lib/firebase/client.ts` |
| `lib/api.ts` | Replaced by Firestore query functions |

---

<a id="phase-5"></a>
## PHASE 5: Admin Dashboard

### STEP 5.1: Create Admin Layout

**File to CREATE:** `frontend/src/app/admin/layout.tsx`

```typescript
// Server Component
import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog?login=required')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin sidebar/header */}
      <nav>{/* Admin navigation */}</nav>
      <main className="p-8">{children}</main>
    </div>
  )
}
```

### STEP 5.2: Create Admin Dashboard Page

**File to CREATE:** `frontend/src/app/admin/page.tsx`

```typescript
// Server Component — fetches stats from Firestore
import { getPosts } from '@/lib/firestore/posts'
import { getContacts } from '@/lib/firestore/contacts'

export default async function AdminDashboard() {
  const [posts, contacts] = await Promise.all([
    getPosts(),
    getContacts(),
  ])

  const publishedCount = posts.filter(p => p.published).length
  const draftCount = posts.length - publishedCount
  const unreadContacts = contacts.filter(c => !c.read).length

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Stats cards */}
      {/* Recent posts list */}
      {/* Unread contacts */}
    </div>
  )
}
```

### STEP 5.3: Refactor Admin Posts Management

**Current:** `AdminPostsList.tsx` (16KB client component) and `AdminPostEditor.tsx` (13KB client component)

**Target:**
- Server Component pages that fetch data and pass to minimal client components
- Mutations via Server Actions (no direct Firestore client writes)

---

<a id="phase-6"></a>
## PHASE 6: Cleanup & Optimization

### STEP 6.1: Update Firestore Security Rules

**File to MODIFY:** `firestore.rules`

Replace the expired "allow all" rule with proper security rules from `SKILL.md` Section 5.5.

### STEP 6.2: Remove Unused Dependencies

From `frontend/package.json`:
- `gray-matter`
- `remark`
- `lucide-react`

### STEP 6.3: Update Shared Types

**File to MODIFY:** `shared/types/post.types.ts`

Add missing fields: `featured`, `coverImage`, `readingTime`

**File to CREATE:** `shared/types/project.types.ts`
**File to CREATE:** `shared/types/contact.types.ts`

### STEP 6.4: Seed Firestore with Real Data

Migrate the hardcoded projects from `useProjects.ts` into Firestore `projects` collection. Create a one-time seed script.

### STEP 6.5: Update next.config.js

- Add remote image patterns for Firebase Storage
- Enable experimental features if needed for Next.js 16

### STEP 6.6: Standardize Language

Choose English or Spanish for UI text and stick with it consistently.

---

<a id="phase-7"></a>
## PHASE 7: Security Hardening & Deployment

### STEP 7.1: Environment Variable Audit

- Verify no `FIREBASE_PRIVATE_KEY` is exposed in client bundles
- Verify `NEXT_PUBLIC_` vars contain only safe-to-expose values
- Add `.env.local` to `.gitignore` (should already be there)

### STEP 7.2: Rate Limiting

- Backend already has `express-rate-limit` — keep
- Add rate limiting to Next.js API routes (`/api/auth/login`) — simple in-memory counter

### STEP 7.3: CSRF Protection

- Session cookie uses `SameSite=Lax` — prevents most CSRF
- Consider adding origin check in auth API routes

### STEP 7.4: Content Security Policy

- Update `next.config.js` with CSP headers
- Allow Firebase Auth domain, Google APIs

### STEP 7.5: Deployment Checklist

- [ ] All env vars set in production
- [ ] Firestore security rules deployed
- [ ] Firebase Hosting config updated (no more SPA rewrites if using SSR)
- [ ] Cloud Functions deployed (if still using backend)
- [ ] Session cookie `secure: true` in production
- [ ] `firebase deploy` succeeds
- [ ] All pages render correctly with SSR

---

## Execution Order Summary

```
PHASE 1: Foundation (Steps 1.1-1.7)
  ├── 1.1 Install dependencies
  ├── 1.2 Firebase Admin SDK init
  ├── 1.3 Refactor Firebase Client SDK
  ├── 1.4 Session cookie utilities
  ├── 1.5 Auth API routes
  ├── 1.6 Middleware route protection
  └── 1.7 Refactor auth store

PHASE 2: Data Layer (Steps 2.1-2.3)
  ├── 2.1 Zod validation schemas
  ├── 2.2 Firestore query functions
  └── 2.3 Server Actions

PHASE 3: Server Component Migration (Steps 3.1-3.6)
  ├── 3.1 Hero split
  ├── 3.2 About split
  ├── 3.3 Navbar split
  ├── 3.4 Projects (remove mock data)
  ├── 3.5 Contact (Server Action form)
  └── 3.6 Blog components

PHASE 4: Client Cleanup (Steps 4.1-4.3)
  ├── 4.1 Remove lucide-react
  ├── 4.2 Replace react-hot-toast
  └── 4.3 Delete unused files

PHASE 5: Admin Dashboard (Steps 5.1-5.3)
  ├── 5.1 Admin layout
  ├── 5.2 Dashboard page
  └── 5.3 Post management refactor

PHASE 6: Cleanup (Steps 6.1-6.6)
  ├── 6.1 Firestore security rules
  ├── 6.2 Remove unused deps
  ├── 6.3 Update shared types
  ├── 6.4 Seed Firestore data
  ├── 6.5 Update next.config.js
  └── 6.6 Standardize language

PHASE 7: Security & Deploy (Steps 7.1-7.5)
  ├── 7.1 Env var audit
  ├── 7.2 Rate limiting
  ├── 7.3 CSRF protection
  ├── 7.4 CSP headers
  └── 7.5 Deployment
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking auth during migration | Implement Phase 1 as atomic unit; test login flow end-to-end before proceeding |
| Firestore indexes needed | Create `firestore.indexes.json` entries for compound queries (published + createdAt) |
| Data loss from mock→Firestore | Seed script runs once; verify data in Firebase Console before deleting mock files |
| Next.js 16 breaking changes | Check migration guide before upgrading; may stay on 15 initially |
| Build size regression | Monitor with `next build` output; compare before/after bundle sizes |
| Firebase Admin cold starts | Use connection pooling; Admin SDK init is singleton pattern |
