# infra/mailer-worker/Dockerfile
# Production Dockerfile for running the TypeScript Batch Mailer Cron Worker on Railway.
#
# Railway Setup Instructions:
# 1. Create a new service in Railway connected to this repository.
# 2. Keep Root Directory as `/` (monorepo root).
# 3. Set Dockerfile Path to `infra/mailer-worker/Dockerfile`.
# 4. Under Service Settings -> Cron Schedule, set e.g. `0 14 * * 1` (Every Monday at 14:00 UTC).
# 5. Configure environment variables: DATABASE_URL, RESEND_API_KEY, TARGET_TAG, NEWSLETTER_FROM.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json ./shared/package.json
COPY frontend/package.json ./frontend/package.json
COPY frontend/prisma ./frontend/prisma

# Install dependencies required for frontend + shared + prisma
RUN pnpm install --frozen-lockfile --filter @personal-website/frontend...

# Copy source files needed by the worker
COPY shared ./shared
COPY frontend/src/emails ./frontend/src/emails
COPY infra/mailer-worker ./infra/mailer-worker

# Generate Prisma Client for the target container platform
RUN pnpm --filter @personal-website/frontend exec prisma generate

# Run the worker using Node 22 + tsx (or npx tsx) and exit cleanly when the batch job finishes
CMD ["pnpm", "--filter", "@personal-website/frontend", "exec", "tsx", "../infra/mailer-worker/mailer-worker.ts"]
