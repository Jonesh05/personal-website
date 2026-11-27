#!/usr/bin/env bash
# infra/mailer-worker/start.sh
# Simple start script for Railway (if deploying without Docker) or manual CLI execution.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "==> [mailer-worker] Ensuring Prisma Client is generated..."
pnpm --filter @personal-website/frontend exec prisma generate

echo "==> [mailer-worker] Launching batch execution for tag: ${TARGET_TAG:-web3}"
pnpm --filter @personal-website/frontend exec tsx "$SCRIPT_DIR/mailer-worker.ts"
