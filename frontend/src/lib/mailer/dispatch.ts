// frontend/src/lib/mailer/dispatch.ts
// Application use case: event-driven newsletter broadcast on article publish.
//
// Architecture (DDD + $0-cost serverless):
// - Domain (`@/domain/newsletter/broadcast`): pure validation, sanitization,
//   URL builders, and deterministic idempotency keys.
// - Infrastructure (`@/lib/firestore/dispatches`, `@/lib/firestore/subscribers`,
//   `@/lib/mailer`): atomic Firestore lock, bounded subscriber query, and
//   Resend Batch API / SMTP delivery.
// - Runs strictly on-demand when an admin publishes a post — zero cronjobs,
//   zero idle compute on Vercel, Spark-safe on Firebase.

import 'server-only'
import * as React from 'react'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import {
  buildBatchIdempotencyKey,
  buildPostUrl,
  buildPreferencesUrl,
  buildUnsubscribeUrl,
  chunkArray,
  normalizeTags,
  sanitizeEmailSubject,
  type BroadcastResult,
  type PostBroadcastInput,
} from '@/domain/newsletter/broadcast'
import {
  acquireBroadcastLock,
  finalizeBroadcastLock,
  releaseBroadcastLock,
} from '@/lib/firestore/dispatches'
import { listActiveSubscribersByTags } from '@/lib/firestore/subscribers'
import { getMailer, sendTransactionalEmail } from '@/lib/mailer'
import { getNewsletterFrom, getSiteUrl } from '@/lib/siteConfig'
import {
  NewsletterTemplate,
  type NewsletterArticleItem,
} from '@/emails/NewsletterTemplate'

export type { BroadcastResult, PostBroadcastInput }

const INTER_BATCH_DELAY_MS = 600

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Dispatches a newly published blog post to all `active` Firestore subscribers
 * whose `tags` intersect with the post's tags (or all active subscribers when
 * the post has no tags). Guaranteed at-most-once per `postId` via an atomic
 * Firestore dispatch lock + Resend `Idempotency-Key`.
 */
export async function broadcastPostToSubscribers(
  post: PostBroadcastInput,
): Promise<BroadcastResult> {
  const cleanTitle = sanitizeEmailSubject(post.title)
  const cleanSlug = post.slug.trim()
  if (!post.postId.trim() || !cleanTitle || !cleanSlug) {
    return {
      status:             'skipped',
      matchedSubscribers: 0,
      sentCount:          0,
      failedCount:        0,
      skippedReason:      'Missing postId, title, or slug',
      errors:             [],
    }
  }

  const fromAddress = getNewsletterFrom()
  if (!fromAddress) {
    return {
      status:             'skipped',
      matchedSubscribers: 0,
      sentCount:          0,
      failedCount:        0,
      skippedReason:      'NEWSLETTER_FROM / CONTACT_NOTIFICATION_FROM not configured',
      errors:             [],
    }
  }

  const mailer = getMailer()
  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? ''
  if (mailer.driver === 'resend' && !resendApiKey) {
    return {
      status:             'skipped',
      matchedSubscribers: 0,
      sentCount:          0,
      failedCount:        0,
      skippedReason:      'RESEND_API_KEY not configured',
      errors:             [],
    }
  }
  if (mailer.driver === 'smtp' && !process.env.SMTP_HOST?.trim()) {
    return {
      status:             'skipped',
      matchedSubscribers: 0,
      sentCount:          0,
      failedCount:        0,
      skippedReason:      'SMTP_HOST not configured',
      errors:             [],
    }
  }

  // Acquire atomic per-post lock to prevent duplicate sends on edits/retries
  let lockAcquired = false
  if (!post.force) {
    lockAcquired = await acquireBroadcastLock(post.postId, {
      slug:  cleanSlug,
      title: cleanTitle,
    })
    if (!lockAcquired) {
      return {
        status:             'already_sent',
        matchedSubscribers: 0,
        sentCount:          0,
        failedCount:        0,
        skippedReason:      'Post was already broadcasted to subscribers',
        errors:             [],
      }
    }
  }

  const normalizedTags = normalizeTags(post.tags)
  const allMatched = await listActiveSubscribersByTags(normalizedTags)
  const subscribers = allMatched.filter(
    (sub) => Boolean(sub.email.trim()) && Boolean(sub.magicToken.trim()),
  )

  if (subscribers.length === 0) {
    if (lockAcquired) {
      await releaseBroadcastLock(post.postId)
    }
    return {
      status:             'skipped',
      matchedSubscribers: 0,
      sentCount:          0,
      failedCount:        0,
      skippedReason:      'No active subscribers matched post tags',
      errors:             [],
    }
  }

  const baseUrl = getSiteUrl()
  const postUrl = buildPostUrl(baseUrl, cleanSlug)
  const cleanExcerpt =
    post.excerpt.trim() ||
    'A new technical article has been published on jonesh.me.'

  const articleItem: NewsletterArticleItem = {
    title:           cleanTitle,
    excerpt:         cleanExcerpt,
    url:             postUrl,
    tag:             normalizedTags[0],
    readTimeMinutes: post.readTimeMinutes ?? 5,
  }

  let sentCount = 0
  let failedCount = 0
  const errors: string[] = []

  if (mailer.driver === 'resend' && resendApiKey) {
    const resend = new Resend(resendApiKey)
    const batches = chunkArray(subscribers, 75)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      try {
        const payloads = await Promise.all(
          batch.map(async (sub) => {
            const preferencesUrl = buildPreferencesUrl(baseUrl, sub.magicToken)
            const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, sub.magicToken)

            const html = await render(
              React.createElement(NewsletterTemplate, {
                subscriberEmail: sub.email,
                magicToken:      sub.magicToken,
                previewText:     cleanExcerpt,
                headline:        cleanTitle,
                introParagraph:  cleanExcerpt,
                articles:        [articleItem],
                ctaLabel:        'Read Full Article →',
                ctaUrl:          postUrl,
                baseUrl,
              }),
            )

            const text = [
              cleanTitle,
              '',
              cleanExcerpt,
              '',
              `Read more: ${postUrl}`,
              `Manage preferences: ${preferencesUrl}`,
              `Unsubscribe: ${unsubscribeUrl}`,
            ].join('\n')

            return {
              from:    fromAddress,
              to:      [sub.email],
              subject: cleanTitle,
              html,
              text,
              headers: {
                'List-Unsubscribe':      `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }
          }),
        )

        const idempotencyKey = buildBatchIdempotencyKey(post.postId, batchIndex)
        const res = await resend.batch.send(payloads, { idempotencyKey })
        if (res.error) {
          failedCount += batch.length
          errors.push(`batch ${batchIndex + 1}: ${res.error.message}`)
          // eslint-disable-next-line no-console
          console.error('[mailer/dispatch] Resend batch error:', res.error)
        } else {
          sentCount += batch.length
        }
      } catch (err) {
        failedCount += batch.length
        const reason = err instanceof Error ? err.message : String(err)
        errors.push(`batch ${batchIndex + 1}: ${reason}`)
        // eslint-disable-next-line no-console
        console.error('[mailer/dispatch] Batch exception:', err)
      }

      // Respect Resend's 2 req/s rate limit only when multiple batches exist
      if (batchIndex < batches.length - 1) {
        await sleep(INTER_BATCH_DELAY_MS)
      }
    }
  } else {
    // Transport-agnostic SMTP delivery (no third-party ESP lock-in)
    for (const sub of subscribers) {
      try {
        const preferencesUrl = buildPreferencesUrl(baseUrl, sub.magicToken)
        const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, sub.magicToken)

        const html = await render(
          React.createElement(NewsletterTemplate, {
            subscriberEmail: sub.email,
            magicToken:      sub.magicToken,
            previewText:     cleanExcerpt,
            headline:        cleanTitle,
            introParagraph:  cleanExcerpt,
            articles:        [articleItem],
            ctaLabel:        'Read Full Article →',
            ctaUrl:          postUrl,
            baseUrl,
          }),
        )

        await sendTransactionalEmail({
          from:    fromAddress,
          to:      sub.email,
          subject: cleanTitle,
          html,
          text: [
            cleanTitle,
            '',
            cleanExcerpt,
            '',
            `Read more: ${postUrl}`,
            `Manage preferences: ${preferencesUrl}`,
            `Unsubscribe: ${unsubscribeUrl}`,
          ].join('\n'),
        })
        sentCount += 1
      } catch (err) {
        failedCount += 1
        const reason = err instanceof Error ? err.message : String(err)
        errors.push(reason)
        // eslint-disable-next-line no-console
        console.error('[mailer/dispatch] SMTP send failed:', err)
      }
    }
  }

  const status: BroadcastResult['status'] =
    sentCount > 0 && failedCount === 0
      ? 'sent'
      : sentCount > 0 && failedCount > 0
        ? 'partial'
        : 'failed'

  if (lockAcquired) {
    if (sentCount === 0) {
      // Release lock on total failure so the admin can safely retry after fixing config/provider
      await releaseBroadcastLock(post.postId)
    } else {
      await finalizeBroadcastLock(post.postId, {
        status,
        matchedSubscribers: subscribers.length,
        sentCount,
        failedCount,
        errors,
      })
    }
  }

  return {
    status,
    matchedSubscribers: subscribers.length,
    sentCount,
    failedCount,
    errors,
  }
}
