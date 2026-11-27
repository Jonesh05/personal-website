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
  buildOneClickUnsubscribeUrl,
  buildPostUrl,
  buildPreferencesUrl,
  buildUnsubscribeUrl,
  chunkArray,
  isDeliverableSubscriberEmail,
  normalizeTags,
  sanitizeEmailSubject,
  type BroadcastAudienceMode,
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
import {
  getNewsletterFrom,
  getPublicContactEmail,
  getSiteUrl,
} from '@/lib/siteConfig'
import { NewsletterTemplate } from '@/emails/NewsletterTemplate'

export type { BroadcastAudienceMode, BroadcastResult, PostBroadcastInput }

const INTER_BATCH_DELAY_MS = 600

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildBroadcastPlainText(params: {
  metaLine: string
  headline: string
  excerpt: string
  postUrl: string
  preferencesUrl: string
  unsubscribeUrl: string
}): string {
  return [
    params.metaLine,
    params.headline,
    '',
    params.excerpt,
    '',
    `Read the full article: ${params.postUrl}`,
    '',
    'Hit reply if you have thoughts or questions — I read every response.',
    '',
    'Best,',
    'Jhonny Pimiento',
    'jonesh.me',
    '',
    '---',
    `Manage preferences: ${params.preferencesUrl}`,
    `Unsubscribe: ${params.unsubscribeUrl}`,
  ].join('\n')
}

/**
 * Dispatches a newly published blog post to active Firestore subscribers.
 * Defaults to `audienceMode: 'all'` so posts on new topics reach all active
 * subscribers; pass `audienceMode: 'matching-tags'` to restrict by tag overlap.
 * Guaranteed at-most-once per `postId` via an atomic Firestore dispatch lock
 * + Resend `Idempotency-Key` (unless `force: true`).
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

  const audienceMode: BroadcastAudienceMode = post.audienceMode ?? 'all'
  const normalizedTags = normalizeTags(post.tags)
  const allMatched = await listActiveSubscribersByTags(
    normalizedTags,
    500,
    audienceMode,
  )
  const validTokenSubscribers = allMatched.filter(
    (sub) => Boolean(sub.email.trim()) && Boolean(sub.magicToken.trim()),
  )
  const skippedReservedEmails = validTokenSubscribers
    .filter((sub) => !isDeliverableSubscriberEmail(sub.email))
    .map((sub) => sub.email)
  if (skippedReservedEmails.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[mailer/dispatch] Skipping ${skippedReservedEmails.length} non-deliverable/reserved test email(s): ${skippedReservedEmails.join(', ')}`,
    )
  }
  const subscribers = validTokenSubscribers.filter((sub) =>
    isDeliverableSubscriberEmail(sub.email),
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
      skippedReason:
        skippedReservedEmails.length > 0
          ? 'Only reserved test email addresses (e.g. example.com) were found — no deliverable subscribers'
          : audienceMode === 'matching-tags'
            ? 'No active subscribers matched post tags'
            : 'No active subscribers found',
      errors:             [],
    }
  }

  const baseUrl = getSiteUrl()
  const replyTo = getPublicContactEmail()
  const postUrl = buildPostUrl(baseUrl, cleanSlug)
  const cleanExcerpt =
    post.excerpt.trim() ||
    'I just published a new engineering note on jonesh.me.'
  const readTimeMinutes = post.readTimeMinutes ?? 5
  const primaryTag = normalizedTags[0]
  const metaLine = primaryTag
    ? `${primaryTag.toUpperCase()} · ${readTimeMinutes} MIN READ`
    : `${readTimeMinutes} MIN READ`

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
            const footerUnsubscribeUrl = buildUnsubscribeUrl(baseUrl, sub.magicToken)
            const oneClickUnsubscribeUrl = buildOneClickUnsubscribeUrl(
              baseUrl,
              sub.magicToken,
            )

            const html = await render(
              React.createElement(NewsletterTemplate, {
                subscriberEmail: sub.email,
                magicToken:      sub.magicToken,
                previewText:     cleanExcerpt,
                metaLine,
                headline:        cleanTitle,
                introParagraph:  cleanExcerpt,
                ctaLabel:        'Read the full article →',
                ctaUrl:          postUrl,
                replyHint:
                  'Hit reply if you have thoughts or questions — I read every response.',
                baseUrl,
              }),
            )

            const text = buildBroadcastPlainText({
              metaLine,
              headline:       cleanTitle,
              excerpt:        cleanExcerpt,
              postUrl,
              preferencesUrl,
              unsubscribeUrl: footerUnsubscribeUrl,
            })

            return {
              from:    fromAddress,
              to:      [sub.email],
              replyTo,
              subject: cleanTitle,
              html,
              text,
              headers: {
                'List-Unsubscribe':      `<${oneClickUnsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                'X-Entity-Ref-ID':       `post-broadcast:${post.postId}:${sub.id.slice(0, 12)}`,
              },
            }
          }),
        )

        const idempotencyKey = post.force
          ? `${buildBatchIdempotencyKey(post.postId, batchIndex)}:${Date.now()}`
          : buildBatchIdempotencyKey(post.postId, batchIndex)
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
        const footerUnsubscribeUrl = buildUnsubscribeUrl(baseUrl, sub.magicToken)
        const oneClickUnsubscribeUrl = buildOneClickUnsubscribeUrl(
          baseUrl,
          sub.magicToken,
        )

        const html = await render(
          React.createElement(NewsletterTemplate, {
            subscriberEmail: sub.email,
            magicToken:      sub.magicToken,
            previewText:     cleanExcerpt,
            metaLine,
            headline:        cleanTitle,
            introParagraph:  cleanExcerpt,
            ctaLabel:        'Read the full article →',
            ctaUrl:          postUrl,
            replyHint:
              'Hit reply if you have thoughts or questions — I read every response.',
            baseUrl,
          }),
        )

        await sendTransactionalEmail({
          from:    fromAddress,
          to:      sub.email,
          replyTo,
          subject: cleanTitle,
          html,
          text: buildBroadcastPlainText({
            metaLine,
            headline:       cleanTitle,
            excerpt:        cleanExcerpt,
            postUrl,
            preferencesUrl,
            unsubscribeUrl: footerUnsubscribeUrl,
          }),
          headers: {
            'List-Unsubscribe':      `<${oneClickUnsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Entity-Ref-ID':       `post-broadcast:${post.postId}:${sub.id.slice(0, 12)}`,
          },
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
  } else if (post.force && sentCount > 0) {
    // Record forced/retried dispatch outcome so Admin Posts reflects latest delivery
    await finalizeBroadcastLock(post.postId, {
      status,
      matchedSubscribers: subscribers.length,
      sentCount,
      failedCount,
      errors,
    })
  }

  return {
    status,
    matchedSubscribers: subscribers.length,
    sentCount,
    failedCount,
    errors,
  }
}
