# Go-to-Market Testing Plan

**Target**: closed alpha in 1–2 weeks · public beta in ~6 weeks · developer-first audience · Stripe live before beta.

## Context

Common Compute has three coupled surfaces — marketing site, backend (api-v2 + router on Cloudflare Workers + D1 + R2), and the Mac provider app — and has shipped none of them to paying users yet. This plan lays out what we test, when, and what must be green before each gate opens.

**Where we are today**
- Web: deployed, live at `commoncompute.ai`.
- API + router: not deployed; `api.commoncompute.ai` does not resolve. Runs locally via `wrangler dev`.
- Provider app: v1.1.0 DMG on the CDN, installable, runs end-to-end against `localhost`.
- CI: one thin workflow (`ci.yml`) runs lint/type-check/test on push; no deploys, no Mac build.
- Observability: zero. No structured logs, no alerts, no crash reporting, no status page data.
- Billing: Stripe keys in `wrangler.toml` but no Checkout, no webhook, no meter, no payout.

**What "done" looks like by phase**
- **Alpha** (day 7–21): 5–10 invited providers run real workloads from 2–3 friendly customers for a week without a crash, with support in the loop. Free $30 credit; no Stripe required.
- **Public beta** (day 21–45): open signups on both sides, Stripe Checkout issues real API keys, metered billing reconciles nightly, SDK docs polished, HN/X launch post.
- **GA** (day 45+): SLO 99.9%, bug bounty open, load-tested to 10× beta volume.

---

## Gate: Ship to Alpha (target: day 10)

Nothing ships to alpha providers until all of these are green.

### API + router deploy
- [ ] `apps/api-v2` deployed to `api.commoncompute.ai` (custom route in `wrangler.toml`). `curl -sI https://api.commoncompute.ai/healthz` returns 200.
- [ ] `apps/router` deployed to `router.commoncompute.ai` (or a workers.dev subdomain). Health-check and WebSocket endpoint reachable.
- [ ] D1 `commoncompute` created in prod; `apps/api-v2/schema.sql` applied; `apps/router/migrations/*` applied. One manual verify: `wrangler d1 execute commoncompute --remote --command "SELECT COUNT(*) FROM users;"` returns 0.
- [ ] Secrets set via `wrangler secret put`: `JWT_SECRET`, `ARGON2_PEPPER`. Stripe secrets skipped (alpha = free credits).

### Auth + enroll + cycle verified in prod
- [ ] `API_BASE=https://api.commoncompute.ai pnpm test:mac-app` — all 5 steps green. Uses the global test account from `tests/fixtures/test-account.ts` — idempotent re-runs are expected.
- [ ] `pnpm smoke` — all 10 scenarios pass with a real provider Mac enrolled against prod, customer-side API key issued via new ad-hoc `/admin/grant-credit` endpoint (alpha-only, IP-allowlisted, removed at beta).
- [ ] Schema drift resolved: router migration 0001 and `apps/api-v2/schema.sql` converge on one source of truth. No more `ALTER TABLE ADD COLUMN full_name` workarounds.

### Mac app hardening
- [ ] Build signed (Developer ID Application) + notarized. Unsigned quarantine prompt does not appear on a fresh Mac. `spctl -a -vv /Applications/CommonCompute.app` passes.
- [ ] First-run flow tested on 3 distinct fresh Mac images:
  1. Apple Silicon M1/M2 on macOS 14
  2. Apple Silicon M3/M4 on macOS 15 (if available)
  3. Intel Mac on macOS 14 (oldest realistic provider)
  Each: install from DMG, onboarding tour, sign in with test account, reach "Earning" status within 30 s, receive + complete one task.
- [ ] Crash reporting wired. Either: (a) `MetricKit` + send crash diagnostics to api-v2 `/v1/diag/crash`, or (b) `Sentry` SDK with a prod DSN. Pick one; get a test crash to land in the dashboard.
- [ ] `os_log` with a subsystem of `ai.commoncompute.app` replaces `print`/silent failures in APIClient, Heartbeat, runners. `log stream --predicate 'subsystem == "ai.commoncompute.app"'` shows the lifecycle of a signed-in session.

### Observability (minimum viable)
- [ ] Structured JSON logs from api-v2 + router. Every request logs `{ts, route, user_id?, device_id?, duration_ms, status}`. Cloudflare Logpush set up to an Axiom/Logtail dataset (cheapest path: Axiom free tier is plenty for alpha).
- [ ] One dashboard per worker: request rate, error rate, p50/p95 latency. Alert: error rate > 5% over 5 min → email.
- [ ] `apps/web/src/app/status/page.tsx` wired to pull the three health-checks (web, api, router) + last-24h uptime from Axiom. No more placeholder text.

### CI gates (added before alpha)
- [ ] `.github/workflows/ci.yml` extended:
  - `pnpm type-check` (already runs)
  - `pnpm test` (unit — new)
  - `pnpm smoke:offline` — the subset of smoke tests that don't require a live provider (health, auth, enroll, rate-limit; new tag)
  - `xcodebuild -scheme CommonCompute -configuration Release` — new job, caches DerivedData, runs on `macos-14` runner. ≤ 6 min.
- [ ] `.github/workflows/provider-dmg.yml`: on tag `v*`, builds + signs + notarizes the DMG, attaches to the GitHub Release, copies to `apps/web/public/downloads/`, opens a PR bumping the download page. **Manual merge + deploy** (no auto-deploy to prod).
- [ ] Branch protection on `main`: require CI green before merge.

### Manual QA checklist
Recorded as a GitHub issue template at `.github/ISSUE_TEMPLATE/release-qa.md`, checked off before every tagged release:
- [ ] Marketing site renders correctly on Safari/Chrome/Firefox (Mac), Safari (iOS), Chrome (Android). Hero + pricing + download CTA clickable, no console errors.
- [ ] Download flow: click CTA → DMG downloads → mount → drag to /Applications → launch → icon in dock → menu bar icon present.
- [ ] Mac app: all 5 tabs render with no crashes after 10 min of idle runtime. Charts populate. Activity log accumulates.
- [ ] Quit from menu bar popover → dock icon disappears. Relaunch → session restores from Keychain. No re-login prompt.

---

## Gate: Ship to Public Beta (target: day 35)

Everything in Alpha, plus:

### Stripe + billing verified
- [ ] `/v1/billing/checkout` creates a Stripe Checkout Session. Success webhook issues a `cc_live_*` API key, lands in `api_keys` table, emails the user.
- [ ] Metered billing: `RouterShard.onComplete` posts usage to a Stripe meter. Nightly Cron reconciles meter totals against D1 ledger entries. Drift alert if > $1.
- [ ] `tests/e2e/billing.test.ts` (new): runs against Stripe test mode. Creates a throwaway customer, buys $30 credit, submits 10 jobs, verifies (a) ledger debits match, (b) Stripe meter events match, (c) API key is usable, (d) revocation on refund works.
- [ ] Failure modes: expired card mid-job, disputed charge, chargeback. Each produces a friendly user email + a locked account state that's recoverable from the account page.

### Customer SDK + docs
- [ ] `@commoncompute/sdk` npm package published, v0.1.0. TypeScript types. Import works on Node 18+ and Deno.
- [ ] `tests/sdk/compat.test.ts`: runs the SDK against the deployed API using the test account's key. Covers every documented endpoint.
- [ ] `apps/web/src/app/docs/*` content complete for: quickstart, authentication, each of the 8 workload types, error codes (matches `ErrorPresenter` + backend constants), pricing math, limits.
- [ ] Code examples copy-pasteable — linted via a `tests/docs/examples.test.ts` that actually executes every fenced `ts` block in the docs.

### Rate limits + abuse protection
- [ ] Cloudflare WAF rules:
  - `/v1/auth/*` → 20 req/min per IP
  - `/v1/bench/*` and `/v1/jobs` → 10 req/s per API key, with burst 30
  - Global 429 response shape matches `ErrorPresenter`'s expected patterns.
- [ ] Cloudflare Turnstile on the web signup form (before `/v1/auth/register` is callable without a Turnstile token from the site).
- [ ] DDoS: leave Cloudflare's defaults on; document where to escalate.

### Load test
- [ ] `tests/load/*.ts` uses [k6](https://k6.io/) or `autocannon` against the deployed API. Scenarios:
  - 100 concurrent customers submitting `/v1/bench/cpu` for 5 min. p95 latency < 500 ms, error rate < 0.5%.
  - 50 devices enrolling + heartbeating simultaneously. No DO contention errors.
  - 1k tasks in flight with 10 providers. Task match latency < 2 s p95. No dropped tasks.
- [ ] Run the load suite nightly on a scaled-down quota (10% of launch target) so we see regressions before they matter.

### Provider app at scale
- [ ] 1-week soak on 3 of the team's own Macs. Acceptance: zero crashes, < 100 MB memory drift, reliability stays > 0.95, thermal pause behaves correctly under real load.
- [ ] Uninstall path documented: drag to trash → Keychain item cleared → launch-at-login entry removed. Verify on a test Mac.
- [ ] Auto-update: ship Sparkle or equivalent. Test one forced update cycle from v1.1.0 → v1.1.1.

### Public surfaces
- [ ] Status page publishes real uptime. `status.commoncompute.ai` (or `/status`) shows last 30 days.
- [ ] `status.commoncompute.ai/incidents` — incident runbook stub live, with contact email.
- [ ] Terms of service + privacy policy final (both pages exist; content is placeholder — replace).
- [ ] `SECURITY.md` in repo root: disclosure address, PGP key, response SLA (72 h ack, 7 day triage).

---

## Gate: Ship to GA (target: day 60+)

Everything in Beta, plus:

- [ ] SLO: 99.9% monthly availability on `/healthz` and the 5 core `/v1/*` endpoints. Error budget tracked in the status page dashboard.
- [ ] Bug bounty program open (HackerOne or a simpler disclosure page; ~$5k initial pool).
- [ ] Accessibility audit (`pnpm --filter @commoncompute/web lint:a11y` via axe-core) — zero WCAG AA violations on the marketing site. Mac app: full VoiceOver pass on Dashboard + Settings.
- [ ] Incident response drill: schedule one internal game day where an on-call engineer recovers from (a) D1 outage, (b) Stripe webhook downtime, (c) bad provider build pushed. Document response time; fix anything that took > 30 min.
- [ ] Load test re-run at 10× beta traffic. Same acceptance bars.
- [ ] Device matrix widened: M1/M2/M3/M4, Intel Macs, macOS 14/15, plus one beta macOS. Spreadsheet tracked in `docs/DEVICE-MATRIX.md`.

---

## What we test (by surface)

| Surface | Automated | Manual |
|---|---|---|
| Marketing site | CI type-check + lint; Lighthouse score ≥ 90 on homepage/pricing/download; Playwright smoke (homepage → pricing → download button → DMG HEAD returns 200). | Device matrix: Safari/Chrome/Firefox desktop + Safari iOS + Chrome Android. Quarterly. |
| Download flow | Automated HEAD check on latest DMG; notarization status check via `spctl`. | New Mac unboxing check: download, mount, install, launch. Every release. |
| Mac app — sign in | `pnpm test:mac-app` in CI against staging. | Manual: first-run tour, sign-in + sign-up flow, password validation UI. |
| Mac app — compute loop | `pnpm smoke` 10 scenarios (live provider required, runs nightly via self-hosted runner). | Manual: 1-week soak on team Macs per release. |
| Mac app — UI | Snapshot tests on DashboardView/EarningsView/JobsView via `swift-snapshot-testing` (new). | Manual: VoiceOver pass, keyboard navigation pass, dark mode render. |
| API — auth | `tests/e2e/mac-app-flow.test.ts` (shipped). | — |
| API — workload routing | `tests/e2e/workload.test.ts` (shipped) + `pnpm smoke`. | — |
| API — billing | `tests/e2e/billing.test.ts` (beta blocker). | — |
| API — SDK compat | `tests/sdk/compat.test.ts` (beta blocker). | — |
| Router — task dispatch | `pnpm smoke` scenarios 3, 4, 6, 7, 8. | — |
| Runners — CPU/GPU/ANE | `pnpm smoke` scenarios 1, 2, 5. | Manual re-run on each new Apple Silicon generation. |
| Load | k6 suite nightly (beta+). | Game-day load spike (GA). |
| Security | CodeQL on PR; `npm audit --audit-level=high` in CI; Cloudflare WAF logs reviewed weekly. | Bug bounty (GA). |

---

## Concrete deliverables — order of operations

### Week 1 (before alpha)
1. **Deploy api-v2 and router to prod.** Fix `wrangler.toml` routes. `curl` green from outside. _(½ day)_
2. **Converge schemas.** Single `migrations/0001_initial.sql` that's the truth, applied to prod D1. Delete the drift between `apps/router/migrations/` and `apps/api-v2/schema.sql`. _(½ day)_
3. **Structured logging + Axiom pipe.** Add `logger.ts` to each Worker that emits JSON. Cloudflare Logpush → Axiom. _(½ day)_
4. **Notarize the Mac app.** Developer ID cert, `notarytool` in `build-dmg.sh`. One-time setup cost. _(1 day)_
5. **MetricKit crash capture.** `MXMetricManager` subscriber in `AppDelegate`, POST diagnostic payloads to `/v1/diag/crash` (new endpoint, stores to R2). _(½ day)_
6. **Status page with real data.** Replace `apps/web/src/app/status/page.tsx` placeholder with a build-time fetch to Axiom's query API for the last 24h uptime per service. Re-deploys nightly via a scheduled Cloudflare Cron. _(½ day)_
7. **Extend CI.** Add the Mac build job + smoke-offline + branch protection. _(½ day)_
8. **Device matrix dry run.** Team borrows 3 Macs, runs the manual QA checklist, fixes anything that cracks. _(1 day)_

### Week 2 (alpha week)
9. Invite 5–10 providers from the team's network. Monitor Axiom dashboard hourly for the first 48 h.
10. Create 2–3 hand-built customer keys via the alpha-only `/admin/grant-credit` endpoint. Have two friendly customers submit real jobs daily.
11. Collect bug reports in a single GitHub Project board. Daily triage.

### Weeks 3–5 (post-alpha hardening)
12. Stripe Checkout + webhook + metered billing. `tests/e2e/billing.test.ts` in CI.
13. SDK v0.1.0 published; docs complete; `tests/sdk/compat.test.ts` green.
14. Rate limits + Turnstile on signup.
15. k6 load suite wired + nightly.
16. Sparkle auto-update.
17. 1-week team-Macs soak.

### Week 6 (public beta launch)
18. Remove `/admin/grant-credit`. Stripe is the only path.
19. HN/X launch copy reviewed. Docs proofread. Status page live.
20. Post-launch: daily error-budget burn check for 14 days. Anything over 0.1% triggers a retro.

---

## What we're deliberately NOT testing (yet)

- **Localization**: English-only through GA.
- **Mobile Mac app (iPad/iPhone)**: not in scope.
- **Browser extensions, CLI tools**: post-GA.
- **Multi-device accounts for providers**: the UI has the hook (`/v1/devices`), but we test and launch with a single-device-per-account assumption.
- **SOC 2 / HIPAA / compliance certifications**: out of scope for GA. Revisit at enterprise pilot.
- **Full chaos engineering / fault injection**: replaced by the single game-day drill at GA.

---

## Success metrics (post-launch)

| Metric | Alpha target | Beta target | GA target |
|---|---|---|---|
| Sign-up → first successful job (provider) | < 5 min median | < 3 min | < 2 min |
| Sign-up → first successful API call (customer) | < 10 min | < 5 min | < 3 min |
| API error rate (5xx) | < 1% | < 0.5% | < 0.1% |
| Provider daily-active rate | — | 30% of installs | 50% of installs |
| Jobs completed without retry | 90% | 95% | 99% |
| NPS (post-first-job survey) | not measured | > 30 | > 50 |

---

## Ownership sketch

| Area | Owner |
|---|---|
| Backend tests, deploys, observability | Infra / backend lead |
| Mac app tests, signing, soak | Mac lead |
| Marketing site, docs, status page | Web lead |
| Billing + Stripe | Backend + ops |
| Manual QA checklist | Whoever tags the release |
| Incident response | Rotating on-call starting at beta |

(Solo shop for now — when rotations start, cron this doc into `docs/ONCALL.md`.)
