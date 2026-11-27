# Execution Layer — Mailing & Segmentation Microservice

Self-owned newsletter subscription, reading-tag segmentation, and batch email delivery worker built with **Next.js App Router**, **PostgreSQL (Railway)**, **Prisma ORM**, **Resend**, and **React Email**. Replaces third-party Listmonk infrastructure.

## Architecture Overview

1. **Data Model (`frontend/prisma/schema.prisma`)**:
   - `Subscriber`: `id` (UUID), `email` (unique), `status` (`pending` | `active` | `unsubscribed`), `tags` (`String[]` with GIN index), `magicToken` (UUID v4 for zero-login Preference Center access).
2. **Subscription & Segmentation (`POST /api/subscribe`)**:
   - Validates payload with Zod (`NewsletterSubscribeSchema`) + honeypot + visitor/IP rate limiting.
   - Performs idempotent upsert in PostgreSQL: merges incoming reading tags without duplicates and ensures a cryptographic `magicToken`.
   - Writes a SHA-256 hashed audit trail in Firestore (`newsletter_leads` & `newsletter_events`).
3. **React Email Template (`frontend/src/emails/NewsletterTemplate.tsx`)**:
   - Minimal editorial dark aesthetic aligned with `jonesh.me`, with dynamic Preference Center / Unsubscribe links pointing to `https://jonesh.me/preferences?token={magicToken}`.
4. **Batch Cron Worker (`infra/mailer-worker/mailer-worker.ts`)**:
   - Queries `active` subscribers (optionally filtered by `TARGET_TAG` when set).
   - Sends in batches of 50–100 emails (`resend.batch.send`) with isolated `try/catch` error handling and structured JSON logs.
5. **Passwordless Preference Center (`/preferences?token={magicToken}` & `/api/preferences`)**:
   - Allows subscribers to update their email address, toggle reading segments (`#WEB3`, `#AI`, `#CYBERSECURITY`, `#CLOUD`, `#REFI`, `#SYSTEM DESIGN`), or one-click unsubscribe without requiring admin OAuth login.

## Deploying on Railway

### 1. Database Setup
1. Provision a **PostgreSQL** service in your Railway project.
2. Copy the `DATABASE_URL` into both your **Vercel** project environment variables and your **Railway Worker** service variables.
3. Push the Prisma schema:
   ```bash
   pnpm --filter @personal-website/frontend exec prisma db push
   ```

### 2. Cron Worker Service on Railway
- **Using Dockerfile (Recommended)**:
  - Root Directory: `/`
  - Dockerfile Path: `infra/mailer-worker/Dockerfile`
  - Cron Schedule: `0 14 * * 1` (Runs every Monday at 14:00 UTC and exits cleanly).
- **Using Start Script**:
  - Start Command: `bash infra/mailer-worker/start.sh`
