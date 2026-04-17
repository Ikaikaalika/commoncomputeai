# Cloudflare Infrastructure Bootstrap

## 1) Install deps

```bash
cd /Users/tylergee/Documents/commoncomputeai
npm install
```

## 2) Create Cloudflare resources (once)

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/control-plane
npx wrangler d1 create commoncompute
npx wrangler kv namespace create SESSION_CACHE
npx wrangler r2 bucket create commoncompute-artifacts
npx wrangler r2 bucket create commoncompute-evidence
npx wrangler queues create job-events
npx wrangler queues create provider-events
npx wrangler queues create billing-events
```

## 3) Update config placeholders

Edit `/Users/tylergee/Documents/commoncomputeai/apps/control-plane/wrangler.jsonc` and replace:

- `REPLACE_WITH_D1_DATABASE_ID`
- `REPLACE_WITH_SESSION_CACHE_ID`

## 4) Apply D1 migration

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/control-plane
npx wrangler d1 migrations apply commoncompute --local
```

## 5) Add secrets

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/control-plane
npx wrangler secret put JWT_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## 6) Local run

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/control-plane
npm run dev
```

## 7) Deploy

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/control-plane
npm run deploy
```
