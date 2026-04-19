# Production Deploy Runbook

First-time production deploy for the api-v2 and router Workers, plus the
D1 database they share. Run these steps once before the alpha gate.

## Prereqs

- `wrangler` authenticated: `wrangler whoami` shows your Cloudflare account.
- `commoncompute.ai` zone exists in that account.
- Developer ID certificate available (covered separately by `docs/MAC-APP-SIGNING.md`, not required for Worker deploy).

## 1. Create the prod D1 database

```bash
cd apps/router
npx wrangler d1 create commoncompute
# Copy the database_id from the output, paste into BOTH:
#   apps/router/wrangler.toml   (replace REPLACE_WITH_D1_DATABASE_ID)
#   apps/api-v2/wrangler.toml   (same value — shared DB)
```

Commit the updated `wrangler.toml` files.

## 2. Apply migrations to prod D1

```bash
cd apps/router
npx wrangler d1 migrations apply commoncompute --remote
```

This runs `migrations/0001_initial.sql` + `0002_add_full_name.sql`.
Verify with:

```bash
npx wrangler d1 execute commoncompute --remote \
  --command "SELECT COUNT(*) AS n FROM users; SELECT COUNT(*) AS n FROM devices;"
```

Both rows should be 0.

## 3. Create the R2 bucket

```bash
npx wrangler r2 bucket create commoncompute-artifacts
```

## 4. Set secrets (per-env)

Run once for each Worker, for the `prod` env:

```bash
# api-v2
cd apps/api-v2
npx wrangler secret put JWT_SECRET --env prod
npx wrangler secret put ARGON2_PEPPER --env prod

# router
cd ../router
npx wrangler secret put JWT_SECRET --env prod
npx wrangler secret put ARGON2_PEPPER --env prod
```

Use the same `JWT_SECRET` and `ARGON2_PEPPER` across both workers — they
verify each other's tokens and password hashes. Generate with:

```bash
openssl rand -hex 32
```

Stripe secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) come during
beta, not alpha.

## 5. Deploy the workers

Deploy order matters: router first (api-v2 has a service binding to it).

```bash
cd apps/router
npx wrangler deploy --env prod

cd ../api-v2
npx wrangler deploy --env prod
```

## 6. Bind custom domains

In the Cloudflare dashboard (manual, one-time):

- **Workers → commoncompute-router → Triggers → Add Custom Domain:**
  `router.commoncompute.ai`
- **Workers → commoncompute-api → Triggers → Add Custom Domain:**
  `api.commoncompute.ai`

Cloudflare auto-creates the CNAME records in the zone.

## 7. Verify end-to-end against prod

```bash
curl -sI https://api.commoncompute.ai/healthz
# → HTTP/2 200

curl -sI https://router.commoncompute.ai/healthz
# → HTTP/2 200

API_BASE=https://api.commoncompute.ai pnpm test:mac-app
# → 5/5 green
```

Last line creates the global test account in prod D1 (idempotent).

## 8. View logs

Zero setup — each `wrangler.toml` already has `[observability] enabled = true`.
JSON lines emitted by the shared logger land in:

- **Cloudflare dashboard** → Workers → `commoncompute-api` → Logs tab.
  Filterable by fields; 7-day retention on free + paid plans.
- **Terminal** live-tail:
  ```bash
  cd apps/api-v2 && npx wrangler tail commoncompute-api --env prod --format pretty
  cd apps/router && npx wrangler tail commoncompute-router --env prod --format pretty
  ```

No external service, no signup, no secrets to manage. When we outgrow
Cloudflare's retention (weeks of data, custom dashboards), we can add
Grafana Cloud's free tier or Baselime later.

## 9. Status page

`apps/web/src/app/status/page.tsx` probes the three health endpoints at
static-export time. Each `pnpm deploy:web` refreshes the page. For
always-fresh uptime, we'll schedule a nightly deploy via Cloudflare
Cron once the beta gate opens.

## Rollback

Every deploy is atomic. If anything breaks:

```bash
cd apps/api-v2    # or router
npx wrangler rollback --env prod
```

No D1 rollback needed unless a migration corrupted data — in which case
restore from the daily D1 backup (Cloudflare keeps 30 days for paid
plans, 7 days on free).
