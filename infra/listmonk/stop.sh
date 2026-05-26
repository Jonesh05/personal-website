#!/usr/bin/env bash
# infra/listmonk/stop.sh
# Stop the listmonk stack without removing data volumes.
#
# Usage:
#   ./stop.sh              # local profile
#   ./stop.sh railway      # railway profile (no-op for managed DB)

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

echo "==> Stopping stack (profile: $PROFILE)"
"${DC[@]}" --profile "$PROFILE" down

echo "Volumes preserved: listmonk_db, listmonk_uploads"
echo "To wipe everything (DESTRUCTIVE): docker volume rm listmonk_listmonk_db listmonk_listmonk_uploads"
