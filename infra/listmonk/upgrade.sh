#!/usr/bin/env bash
# infra/listmonk/upgrade.sh
# Pull the latest listmonk image and run schema migrations.
# Backs up the database first when running the `local` profile.
#
# Usage:
#   ./upgrade.sh              # local profile
#   ./upgrade.sh railway      # railway profile

set -euo pipefail

cd "$(dirname "$0")"

PROFILE="${1:-local}"
if [[ "$PROFILE" != "local" && "$PROFILE" != "railway" ]]; then
  echo "usage: $0 [local|railway]" >&2
  exit 2
fi

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
else
  DC=(docker-compose)
fi

if [[ "$PROFILE" == "local" ]]; then
  echo "==> Backing up Postgres before upgrade"
  ./backup.sh || {
    echo "error: backup failed; aborting upgrade." >&2
    exit 1
  }
fi

echo "==> Pulling latest listmonk image"
"${DC[@]}" --profile "$PROFILE" pull listmonk

echo "==> Running schema migration (--upgrade)"
"${DC[@]}" --profile "$PROFILE" run --rm listmonk ./listmonk --upgrade --yes

echo "==> Restarting listmonk"
"${DC[@]}" --profile "$PROFILE" up -d listmonk

echo "Upgrade complete."
