'use client'

import Link   from 'next/link'
import type { Post } from '@/lib/firestore/posts'

interface Props { 
  post: Post & { readingTime?: number; coverImage?: string } 
}

function formatDate(raw: Post['createdAt']): string {
  if (!raw) return ''
  const ms = typeof raw === 'string'
    ? Date.parse(raw)
    : (raw as any)._seconds
      ? (raw as any)._seconds * 1000
      : Date.parse(String(raw))
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function BlogPostContent({ post }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 pt-[106px] text-gray-100">
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">

        {/* Breadcrumb */}
        <Link href="/blog"
          className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Blog
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {post.tags.map(tag => (
              <span key={tag}
                className="text-xs bg-orange-900/40 text-orange-300 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold text-white leading-tight mb-5">{post.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-10">
          <span>{post.authorName ?? 'JP'}</span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
          {post.readingTime && <><span>·</span><span>{post.readingTime} min read</span></>}
          {post.views != null && <><span>·</span><span>{post.views} views</span></>}
        </div>

        {/* Cover image */}
        {(post.featuredImage || post.coverImage) && (
          <img
            src={post.featuredImage ?? post.coverImage}
            alt={post.title}
            className="w-full rounded-2xl mb-12 object-cover max-h-96"
          />
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-gray-300 border-l-4 border-orange-500 pl-5 mb-12 italic leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Content — line-by-line markdown render */}
        <div className="space-y-4">
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('### '))
              return <h3 key={i} className="text-xl font-bold text-white mt-10 mb-2">{line.slice(4)}</h3>
            if (line.startsWith('## '))
              return <h2 key={i} className="text-2xl font-bold text-white mt-12 mb-3">{line.slice(3)}</h2>
            if (line.startsWith('# '))
              return <h1 key={i} className="text-3xl font-bold text-white mt-14 mb-4">{line.slice(2)}</h1>
            if (line.startsWith('```'))
              return (
                <pre key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 overflow-x-auto">
                  <code className="text-sm text-orange-300 font-mono">{line.slice(3)}</code>
                </pre>
              )
            if (line.startsWith('> '))
              return <blockquote key={i} className="border-l-4 border-orange-500 pl-5 text-gray-400 italic">{line.slice(2)}</blockquote>
            if (line === '') return <div key={i} className="h-2" />
            return <p key={i} className="text-gray-300 leading-relaxed">{line}</p>
          })}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-gray-800 flex items-center justify-between">
          <Link href="/blog" className="text-orange-400 hover:text-orange-300 transition text-sm">
            ← All posts
          </Link>
          {post.likes != null && (
            <span className="text-gray-500 text-sm">♥ {post.likes}</span>
          )}
        </div>
      </div>
    </div>
  )
}
