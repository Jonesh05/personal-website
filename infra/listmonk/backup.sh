#!/usr/bin/env bash
# infra/listmonk/backup.sh
# Dump the listmonk Postgres database to a gzipped SQL file.
#
# Works in two modes:
#   - local:    pg_dump runs inside the `db` container against the local volume.
#   - external: when LISTMONK_DB_HOST is not "db" (e.g. Railway-managed pg),
#               we exec pg_dump from a transient postgres:16-alpine container
#               connecting to the external host using the same creds.

set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "error: .env not found." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

TS="$(date -u +%Y%m%d-%H%M%SZ)"
OUT="$BACKUP_DIR/listmonk-$TS.sql.gz"

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
else
  DC=(docker-compose)
fi

DB_HOST="${LISTMONK_DB_HOST:-db}"
DB_PORT="${LISTMONK_DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-listmonk}"
DB_NAME="${POSTGRES_DB:-listmonk}"

echo "==> Dumping $DB_NAME from $DB_HOST:$DB_PORT to $OUT"

if [[ "$DB_HOST" == "db" ]]; then
  # Local profile: dump from inside the running db container (no network exposure required).
  "${DC[@]}" --profile local exec -T db \
    env PGPASSWORD="$POSTGRES_PASSWORD" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --clean --if-exists \
    | gzip -9 > "$OUT"
else
  # External / managed db: run a one-shot postgres:16-alpine client.
  docker run --rm \
    -e PGPASSWORD="$POSTGRES_PASSWORD" \
    postgres:16-alpine \
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --no-owner --clean --if-exists \
    | gzip -9 > "$OUT"
fi

echo "==> Wrote $(du -h "$OUT" | cut -f1) to $OUT"

echo "==> Pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'listmonk-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -print -delete || true

echo "Backup complete."
