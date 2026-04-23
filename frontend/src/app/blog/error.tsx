'use client'

// frontend/src/app/blog/error.tsx
// Scoped error boundary for the /blog route segment.
//
// Any unhandled exception thrown by the /blog server tree (Firestore reads,
// Admin SDK init failures, etc.) lands here instead of producing a generic
// Next.js 500 page with an opaque digest. The boundary:
//
//   - keeps the page shell usable (no white-screen crash),
//   - gives the user a retry affordance,
//   - surfaces the digest so we can correlate to Vercel function logs.
//
// This is a last-resort safety net. Data fetches inside /blog server
// components should already `try/catch` locally so a single failing widget
// does not bubble up to this boundary.

import { useEffect } from 'react'
import Link from 'next/link'

interface BlogErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BlogError({ error, reset }: BlogErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[blog/error-boundary]', {
      digest: error.digest,
      message: error.message,
    })
  }, [error])

  return (
    <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong loading the blog
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          The page could not load right now. You can retry, or head back home.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono">
            ref: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
