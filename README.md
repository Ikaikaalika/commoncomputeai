# Common Commute

Common Commute is a Mac-first distributed compute marketplace. The canonical product surface is now the FastAPI app under `apps/api`, with Cloudflare used for edge delivery and AWS used for backend runtime and data services.

## Repo Layout

- `apps/api` - FastAPI website and API
- `apps/macos/CommonCommute` - SwiftUI provider worker companion
- `infra/aws` - backend deployment starter
- `tests` - root API and page smoke tests
- `scripts` - root seed and smoke scripts
- `apps/control-plane` - legacy Cloudflare Worker control plane kept for reference
- `packages/contracts` - shared TypeScript contracts used by the legacy stack

## What this build ships

- Public landing page for the new Common Commute direction
- Provider dashboard for register, login, device enrollment, polling, and completion
- Customer dashboard for register, login, and job submission
- FastAPI API with SQLite-backed local development
- Native macOS provider app that can target a configured backend URL
- AWS starter architecture notes for production hosting

## First Run

1. Create and activate a Python virtual environment:

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Start the API:

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/api
uvicorn app.main:app --reload
```

3. Open:
- Landing page: `http://127.0.0.1:8000/`
- Provider dashboard: `http://127.0.0.1:8000/provider-dashboard`
- Customer dashboard: `http://127.0.0.1:8000/customer-dashboard`
- API docs: `http://127.0.0.1:8000/docs`

4. Seed demo data if needed:

```bash
cd /Users/tylergee/Documents/commoncomputeai
python scripts/seed_demo.py
```

5. Run the smoke flow:

```bash
cd /Users/tylergee/Documents/commoncomputeai
API_BASE=http://127.0.0.1:8000 node scripts/smoke-api.mjs
```

## Environment

- `API_BASE_URL` controls the website's client-side API target.
- `COMMONCOMMUTE_API_BASE_URL` or `API_BASE_URL` controls the macOS app backend target.
- `DATABASE_PATH` overrides the SQLite file used by the FastAPI app.

## Legacy Path

The old Cloudflare Worker control plane remains in `apps/control-plane`, but it is no longer the primary product path. Use the `legacy:*` npm scripts only if you need that reference stack.
