// infra/mailer-worker/mailer-worker.ts
// Asynchronous Batch Mailer Worker (Cron Job for Railway).
//
// Responsibilities:
// 1. Queries PostgreSQL (Prisma) for `active` subscribers filtered by a target
//    reading segment tag (e.g., `TARGET_TAG=web3`).
// 2. Renders personalized `NewsletterTemplate` HTML per subscriber (embedding
//    their unique `magicToken` for zero-login Preference Center / Unsubscribe).
// 3. Groups outbound dispatches into batches of 50–100 emails (default: 75) to
//    optimize Resend API throughput (`resend.batch.send`) and respect rate limits.
// 4. Implements structured JSON logging, per-batch try/catch isolation, and
//    graceful Prisma disconnection.
//
// Railway Deployment Notes:
// -------------------------
// Option A (Dockerfile):
//   Set Railway Root Directory to `/` (repo root) and Dockerfile Path to
//   `infra/mailer-worker/Dockerfile`. Configure a Railway Cron Schedule
//   (e.g. `0 14 * * 1` for Mondays at 14:00 UTC).
//
// Option B (Simple Start Script):
//   Run `bash infra/mailer-worker/start.sh` or
//   `pnpm --filter @personal-website/frontend worker:mailer`

import * as React from 'react'
import { PrismaClient } from '@prisma/client'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import {
  NewsletterTemplate,
  type NewsletterArticleItem,
} from '../../frontend/src/emails/NewsletterTemplate'

interface WorkerConfig {
  targetTag?:     string
  batchSize:      number
  batchDelayMs:   number
  dryRun:         boolean
  fromAddress:    string
  subjectLine:    string
  headline:       string
  introParagraph: string
  editionNumber:  number
  baseUrl:        string
  resendApiKey:   string
}

interface BatchExecutionMetrics {
  totalMatched:  number
  totalBatches:  number
  sentCount:     number
  failedCount:   number
  durationMs:    number
}

function loadConfig(): WorkerConfig {
  const resendApiKey = process.env.RESEND_API_KEY ?? ''
  const dryRun = process.env.DRY_RUN === 'true'

  if (!resendApiKey && !dryRun) {
    throw new Error(
      '[mailer-worker] Missing RESEND_API_KEY environment variable (set DRY_RUN=true to test without sending).',
    )
  }

  // Clamp batch size between 50 and 100 as required by architectural spec
  // (Resend batch API supports up to 100 emails per request).
  const rawBatch = Number(process.env.BATCH_SIZE ?? '75')
  const batchSize = Number.isFinite(rawBatch)
    ? Math.min(100, Math.max(50, Math.floor(rawBatch)))
    : 75

  // Resend standard rate limit is 2 req/s; 1000ms between batches keeps
  // multi-batch dispatches safely under the limit (skipped when <= 1 batch).
  const rawDelay = Number(process.env.BATCH_DELAY_MS ?? '1000')
  const batchDelayMs = Number.isFinite(rawDelay) && rawDelay >= 0 ? rawDelay : 1000

  const editionNumber = Number(process.env.EDITION_NUMBER ?? '1') || 1
  const rawTargetTag = process.env.TARGET_TAG?.trim().toLowerCase()
  const targetTag = rawTargetTag ? rawTargetTag : undefined
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jonesh.me').replace(/\/+$/, '')

  return {
    targetTag,
    batchSize,
    batchDelayMs,
    dryRun,
    fromAddress:
      process.env.NEWSLETTER_FROM?.trim() ||
      'jonesh.me <newsletter@mail.jonesh.me>',
    subjectLine:
      process.env.DISPATCH_SUBJECT?.trim() ||
      `Dispatch #${String(editionNumber).padStart(3, '0')} — jonesh.me`,
    headline:
      process.env.DISPATCH_HEADLINE?.trim() ||
      'Latest Engineering Notes & Architecture Dispatches',
    introParagraph:
      process.env.DISPATCH_INTRO?.trim() ||
      'New technical writing on decentralized protocols, security architecture, and production systems.',
    editionNumber,
    baseUrl,
    resendApiKey,
  }
}

function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function logStructured(
  level: 'INFO' | 'WARN' | 'ERROR',
  event: string,
  meta: Record<string, unknown> = {},
): void {
  const payload = {
    timestamp: new Date().toISOString(),
    service:   'mailer-worker',
    level,
    event,
    ...meta,
  }
  if (level === 'ERROR') {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(payload))
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload))
  }
}

function buildDefaultArticles(baseUrl: string): NewsletterArticleItem[] {
  return [
    {
      title:           'Lanark Agentic Marketplace: On-Chain Execution on CELO',
      excerpt:         'How autonomous AI agents negotiate, verify, and settle stablecoin transactions with deterministic guardrails.',
      url:             `${baseUrl}/work`,
      tag:             'web3',
      readTimeMinutes: 6,
    },
    {
      title:           'Zero-Trust Microservices & Cryptographic Magic Tokens',
      excerpt:         'Designing passwordless preference centers and self-hosted mailing pipelines without third-party bloat.',
      url:             `${baseUrl}/blog`,
      tag:             'cybersecurity',
      readTimeMinutes: 5,
    },
  ]
}

export async function runMailerWorker(): Promise<BatchExecutionMetrics> {
  const startedAt = Date.now()
  const cfg = loadConfig()
  const prisma = new PrismaClient()
  const resend = cfg.dryRun ? null : new Resend(cfg.resendApiKey)

  logStructured('INFO', 'worker_started', {
    targetTag:    cfg.targetTag,
    batchSize:    cfg.batchSize,
    dryRun:       cfg.dryRun,
    edition:      cfg.editionNumber,
  })

  try {
    // 1. Query active subscribers (optionally segmented by `targetTag` when configured)
    const subscribers = await prisma.subscriber.findMany({
      where: {
        status: 'active',
        ...(cfg.targetTag ? { tags: { has: cfg.targetTag } } : {}),
      },
      select: {
        id:         true,
        email:      true,
        magicToken: true,
        tags:       true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (subscribers.length === 0) {
      logStructured('INFO', 'no_matching_subscribers', {
        targetTag: cfg.targetTag,
      })
      return {
        totalMatched: 0,
        totalBatches: 0,
        sentCount:    0,
        failedCount:  0,
        durationMs:   Date.now() - startedAt,
      }
    }

    // 2. Group into batches of 50–100 emails
    const batches = chunkArray(subscribers, cfg.batchSize)
    let sentCount = 0
    let failedCount = 0

    logStructured('INFO', 'batches_prepared', {
      totalSubscribers: subscribers.length,
      totalBatches:     batches.length,
      batchSize:        cfg.batchSize,
    })

    // 3. Process each batch sequentially with isolated error handling
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const currentBatch = batches[batchIndex]
      const batchNumber = batchIndex + 1

      try {
        // Render personalized React Email template for each subscriber in the batch
        const emailPayloads = await Promise.all(
          currentBatch.map(async sub => {
            const html = await render(
              React.createElement(NewsletterTemplate, {
                subscriberEmail: sub.email,
                magicToken:      sub.magicToken,
                editionNumber:   cfg.editionNumber,
                headline:        cfg.headline,
                introParagraph:  cfg.introParagraph,
                articles:        buildDefaultArticles(cfg.baseUrl),
                ctaUrl:          `${cfg.baseUrl}/blog`,
                baseUrl:         cfg.baseUrl,
              }),
            )

            return {
              from:    cfg.fromAddress,
              to:      [sub.email],
              subject: cfg.subjectLine,
              html,
              headers: {
                'List-Unsubscribe': `<${cfg.baseUrl.replace(/\/$/, '')}/preferences?token=${encodeURIComponent(sub.magicToken)}&action=unsubscribe>`,
              },
            }
          }),
        )

        if (cfg.dryRun || !resend) {
          sentCount += currentBatch.length
          logStructured('INFO', 'batch_dry_run_completed', {
            batchNumber,
            totalBatches: batches.length,
            batchCount:   currentBatch.length,
          })
        } else {
          const response = await resend.batch.send(emailPayloads)

          if (response.error) {
            failedCount += currentBatch.length
            logStructured('ERROR', 'batch_provider_error', {
              batchNumber,
              totalBatches: batches.length,
              batchCount:   currentBatch.length,
              errorName:    response.error.name,
              errorMessage: response.error.message,
            })
          } else {
            sentCount += currentBatch.length
            logStructured('INFO', 'batch_dispatched', {
              batchNumber,
              totalBatches: batches.length,
              batchCount:   currentBatch.length,
              resendIds:    response.data?.data?.map(d => d.id) ?? [],
            })
          }
        }
      } catch (batchErr) {
        failedCount += currentBatch.length
        logStructured('ERROR', 'batch_exception', {
          batchNumber,
          totalBatches: batches.length,
          batchCount:   currentBatch.length,
          reason:       batchErr instanceof Error ? batchErr.message : String(batchErr),
        })
      }

      // Throttle between batches if more remain
      if (batchIndex < batches.length - 1 && cfg.batchDelayMs > 0) {
        await sleep(cfg.batchDelayMs)
      }
    }

    const metrics: BatchExecutionMetrics = {
      totalMatched: subscribers.length,
      totalBatches: batches.length,
      sentCount,
      failedCount,
      durationMs:   Date.now() - startedAt,
    }

    logStructured('INFO', 'worker_finished', { ...metrics })
    return metrics
  } finally {
    await prisma.$disconnect()
  }
}

// Execute immediately when invoked as a standalone CLI / Railway Cron script
if (require.main === module) {
  runMailerWorker()
    .then(metrics => {
      if (metrics.failedCount > 0 && metrics.sentCount === 0) {
        process.exitCode = 1
      }
    })
    .catch(err => {
      logStructured('ERROR', 'worker_fatal_crash', {
        reason: err instanceof Error ? err.message : String(err),
      })
      process.exitCode = 1
    })
}
