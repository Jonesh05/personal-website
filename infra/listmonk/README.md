# infra/listmonk

Self-hosted [listmonk](https://listmonk.app/) deployment for the personal-website project.

listmonk is the **newsletter provider**. It owns:

- subscriber storage,
- double opt-in flow,
- confirmation / unsubscribe emails,
- campaign delivery.

The frontend (`frontend/`) is the **acquisition surface** only. Every subscribe submission is hashed and logged to Firestore (`newsletter_leads`), then forwarded to listmonk via the admin API. Firestore is never used as listmonk's database.

## Layout

```
infra/listmonk/
├── docker-compose.yml   # postgres + listmonk, two profiles (local / railway)
├── .env.example         # copy to .env; never commit the populated file
├── start.sh             # boot the stack (idempotent --install on first run)
├── stop.sh              # docker compose down (volumes preserved)
├── upgrade.sh           # pull latest, backup, run --upgrade, restart
└── backup.sh            # gzipped pg_dump with retention
```

## Local quick-start

```bash
cd infra/listmonk
cp .env.example .env
$EDITOR .env                       # set strong admin password + SMTP creds
./start.sh                         # local profile: db + app
open http://localhost:9000         # admin UI
```

## Railway deployment

1. Create a Railway project.
2. Add the PostgreSQL plugin and note the connection details Railway exposes.
3. Deploy the listmonk service from this repo's `infra/listmonk/` folder.
4. Set the environment variables from `.env.example` in the Railway service:
   - `LISTMONK_ADMIN_USER`, `LISTMONK_ADMIN_PASSWORD`
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — copy from the Railway Postgres plugin.
   - `LISTMONK_DB_HOST`, `LISTMONK_DB_PORT` — host/port from the plugin.
   - `LISTMONK_DB_SSL_MODE=require` if Railway-managed Postgres requires TLS.
   - `SMTP_*` — outbound mail relay settings.
5. Attach the custom domain `https://example.com` to the listmonk service.
6. After first deploy, run schema install once:
   ```bash
   railway run --service listmonk ./listmonk --install --idempotent --yes
   ```
7. Inside the admin UI:
   - Create the public list "Newsletter".
   - Enable double opt-in on that list.
   - Note the numeric `id` of the list — this is `LISTMONK_LIST_ID` for the frontend.
   - Create an admin API user under Users → New. The username and token are `LISTMONK_API_USER` / `LISTMONK_API_TOKEN` for the frontend.
   - Confirm the SMTP settings in the UI match the configured env vars.

## Operating

- `./upgrade.sh` — back up the DB, pull latest image, run schema migrations, restart.
- `./backup.sh` — manual `pg_dump` into `./backups`, with retention pruning by `BACKUP_RETENTION_DAYS`.
- `./stop.sh` — graceful stop; volumes preserved.

## Security notes

- Never expose Postgres publicly. The local compose binds it to `127.0.0.1`; on Railway use the internal network only.
- listmonk admin API uses Basic auth; rotate `LISTMONK_API_TOKEN` periodically and store it only in the Vercel project env vars, never in client-side code.
- Firestore writes for newsletter leads stay server-only and use `sha256(email)` as the document id.
- Keep raw email only where strictly required for newsletter delivery, not for analytics or unnecessary persistence.
