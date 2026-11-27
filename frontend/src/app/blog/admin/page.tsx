import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getPosts } from '@/lib/firestore/posts'
import { getContacts } from '@/lib/firestore/contacts'
import { readSubscriberTelemetry } from '@/lib/firestore/subscribers'
import { getAzureOpenAIStatus } from '@/lib/ai/azureOpenai'
import { NEWSLETTER_TAGS } from '@personal-website/shared/schemas/newsletter.schema'
import { getServerTranslations } from '@/i18n/server'

export const dynamic = 'force-dynamic'

interface SubscriberTelemetry {
  active: number
  unsubscribed: number
  total: number
  tagCounts: Record<string, number>
  dbOnline: boolean
}

async function getSubscriberTelemetry(): Promise<SubscriberTelemetry> {
  try {
    const summary = await readSubscriberTelemetry(NEWSLETTER_TAGS)
    return {
      ...summary,
      dbOnline: true,
    }
  } catch {
    const tagCounts: Record<string, number> = {}
    for (const tag of NEWSLETTER_TAGS) {
      tagCounts[tag] = 0
    }
    return {
      active:       0,
      unsubscribed: 0,
      total:        0,
      tagCounts,
      dbOnline:     false,
    }
  }
}

export default async function AdminPage() {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog?login=required')
  const { t } = await getServerTranslations('AdminDashboard')

  const [posts, contacts, subTelemetry] = await Promise.all([
    getPosts().catch(() => []),
    getContacts().catch(() => []),
    getSubscriberTelemetry(),
  ])

  const aiStatus = getAzureOpenAIStatus()

  const published = posts.filter(p => p.published).length
  const drafts = posts.length - published
  const totalViews = posts.reduce((acc, p) => acc + (p.views ?? 0), 0)
  const unread = contacts.filter(c => !c.read).length

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-1"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-green-neon)',
            }}
          >
            EXECUTION LAYER • COMMAND CENTER
          </p>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('dashboard')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/blog/admin/posts"
            className="rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300 border border-slate-700 bg-slate-900/80 hover:border-slate-500 hover:text-white transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Manage Posts ({posts.length})
          </Link>
          <Link
            href="/blog/admin/posts/new"
            className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--gradient-plasma)',
              boxShadow: '0 0 24px rgba(124, 58, 237, 0.35)',
            }}
          >
            {t('newPost')}
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: t('published'),
            value: published,
            sub: 'Live on /blog',
            color: 'text-emerald-400',
            border: 'rgba(16, 185, 129, 0.3)',
          },
          {
            label: t('drafts'),
            value: drafts,
            sub: 'In staging',
            color: 'text-amber-400',
            border: 'rgba(245, 158, 11, 0.3)',
          },
          {
            label: 'Total Views',
            value: totalViews,
            sub: 'Unique readers',
            color: 'text-purple-400',
            border: 'rgba(191, 94, 255, 0.3)',
          },
          {
            label: 'Active Subscribers',
            value: subTelemetry.active,
            sub: subTelemetry.dbOnline ? `${subTelemetry.total} total in PG` : 'PG offline/unconfigured',
            color: 'text-teal-300',
            border: 'rgba(45, 212, 191, 0.3)',
          },
          {
            label: 'Unsubscribed',
            value: subTelemetry.unsubscribed,
            sub: 'Opted out via token',
            color: 'text-slate-400',
            border: 'rgba(148, 163, 184, 0.2)',
          },
          {
            label: t('unreadMessages'),
            value: unread,
            sub: `${contacts.length} total inquiries`,
            color: 'text-orange-400',
            border: 'rgba(251, 146, 60, 0.3)',
          },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{
              background: 'var(--color-surface-2)',
              border: `1px solid ${card.border}`,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p
              className="text-[11px] uppercase tracking-wider text-slate-400"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {card.label}
            </p>
            <p
              className={`mt-3 text-3xl font-extrabold ${card.color}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {card.value}
            </p>
            <p
              className="mt-2 text-[11px] text-slate-500 truncate"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Execution Layer: Reading Segmentation & Azure OpenAI Copilot Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Newsletter Segmentation Distribution (PostgreSQL + Prisma) */}
        <div
          className="lg:col-span-7 rounded-2xl p-6 border"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <span
                className="text-[11px] uppercase tracking-widest text-teal-400 block"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                [PRISMA + RESEND EXECUTION LAYER]
              </span>
              <h2
                className="text-lg font-bold text-white mt-0.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Audience Reading Segments
              </h2>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                subTelemetry.dbOnline
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {subTelemetry.dbOnline ? 'POSTGRES: CONNECTED' : 'POSTGRES: AWAITING DATABASE_URL'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-5">
            When you publish a post with <strong>&ldquo;Dispatch Newsletter to Segment&rdquo;</strong> enabled,
            subscribers matching the post&apos;s tags automatically receive the React Email template in batches of 75.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NEWSLETTER_TAGS.map(tag => {
              const count = subTelemetry.tagCounts[tag] ?? 0
              return (
                <div
                  key={tag}
                  className="rounded-xl p-3.5 border flex items-center justify-between"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase text-purple-300"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    #{tag}
                  </span>
                  <span
                    className="text-sm font-bold text-white px-2 py-0.5 rounded bg-white/5"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Azure OpenAI Editorial Copilot Status Card */}
        <div
          className="lg:col-span-5 rounded-2xl p-6 border flex flex-col justify-between"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'rgba(124, 58, 237, 0.35)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[11px] uppercase tracking-widest text-purple-400"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                [AZURE OPENAI COPILOT]
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  aiStatus.configured
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {aiStatus.configured ? `READY (${aiStatus.deployment})` : 'ENV STANDBY'}
              </span>
            </div>

            <h2
              className="text-lg font-bold text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              AI Editorial &amp; Tagging Engine
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Automatically synthesizes executive summaries (`excerpt`) and classifies articles into reading segments (`web3`, `ai`, `cybersecurity`, `cloud`, `refi`, `engineering`) inside the Post Editor.
            </p>
          </div>

          <div
            className="rounded-xl p-3.5 border text-xs space-y-1.5"
            style={{
              background: 'rgba(4, 8, 15, 0.65)',
              borderColor: 'var(--color-border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div className="text-slate-400">
              <span className="text-teal-400">$</span> AZURE_OPENAI_ENDPOINT={' '}
              <span className="text-slate-300">{aiStatus.endpointHost ?? 'not-set'}</span>
            </div>
            <div className="text-slate-400">
              <span className="text-teal-400">$</span> AZURE_OPENAI_DEPLOYMENT={' '}
              <span className="text-slate-300">{aiStatus.deployment ?? 'gpt-4o'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts Table */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          background: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="font-bold text-white text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('recentPosts')}
          </h2>
          <Link
            href="/blog/admin/posts"
            className="text-xs font-bold uppercase tracking-wider text-purple-400 transition-colors hover:text-purple-300"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {t('viewAll')} →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {t('noPostsYet')}{' '}
            <Link href="/blog/admin/posts/new" className="text-purple-400 hover:underline">
              {t('createFirstPost')} →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b text-left text-[11px] uppercase tracking-wider text-slate-400"
                  style={{
                    borderColor: 'var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <th className="px-6 py-3.5">{t('title')}</th>
                  <th className="px-6 py-3.5">Segments</th>
                  <th className="px-6 py-3.5">{t('status')}</th>
                  <th className="px-6 py-3.5">{t('views')}</th>
                  <th className="px-6 py-3.5 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 8).map(post => (
                  <tr
                    key={post.id}
                    className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'rgba(26, 38, 64, 0.6)' }}
                  >
                    <td className="max-w-md truncate px-6 py-4 font-medium text-slate-100">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          post.published
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {post.published ? t('publishedShort') : t('draftShort')}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-slate-400"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {post.views ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-xs text-slate-400 transition-colors hover:text-white"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/blog/admin/posts/${post.id}`}
                        className="text-xs text-teal-400 transition-colors hover:text-teal-300 font-semibold"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {t('edit')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
