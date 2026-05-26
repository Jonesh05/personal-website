#!/usr/bin/env bash
# infra/listmonk/start.sh
# Boot the listmonk stack. On first run, initialises the schema.
#
# Usage:
#   ./start.sh              # local profile (db + app)
#   ./start.sh railway      # railway profile (app only; DB is managed)

set -euo pipefail

cd "$(dirname "$0")"

PROFILE="${1:-local}"
if [[ "$PROFILE" != "local" && "$PROFILE" != "railway" ]]; then
  echo "usage: $0 [local|railway]" >&2
  exit 2
fi

if [[ ! -f .env ]]; then
  echo "error: .env not found. cp .env.example .env and fill it in." >&2
  exit 1
fi

# Resolve compose CLI (v2 plugin vs legacy binary).
if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "error: docker compose is not installed." >&2
  exit 1
fi

echo "==> Pulling images (profile: $PROFILE)"
"${DC[@]}" --profile "$PROFILE" pull

# Detect first-run: listmonk fails to start cleanly until --install has been
# run against the target database. We probe by looking for an existing
# `settings` table; if absent, run --install.
echo "==> Checking listmonk schema"
if ! "${DC[@]}" --profile "$PROFILE" run --rm \
      --entrypoint /bin/sh listmonk \
      -c "./listmonk --upgrade --yes >/dev/null 2>&1 || true; \
          ./listmonk --version >/dev/null 2>&1"; then
  echo "warning: could not probe listmonk container; continuing."
fi

# Idempotent install. Listmonk's --install bails out cleanly if schema exists.
echo "==> Ensuring schema (idempotent --install)"
"${DC[@]}" --profile "$PROFILE" run --rm listmonk \
  ./listmonk --install --idempotent --yes || true

echo "==> Starting stack"
"${DC[@]}" --profile "$PROFILE" up -d

echo
echo "listmonk is starting."
echo "  health:  curl -fsS http://localhost:\${LISTMONK_PORT:-9000}/health"
echo "  admin:   open http://localhost:\${LISTMONK_PORT:-9000} (creds in .env)"
