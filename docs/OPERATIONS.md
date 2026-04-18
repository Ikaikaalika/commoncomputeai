# Operations Notes

## Local Startup

```bash
cd /Users/tylergee/Documents/commoncomputeai/apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Demo Data

Seed a small local dataset:

```bash
cd /Users/tylergee/Documents/commoncomputeai
python scripts/seed_demo.py
```

## Smoke Test

Run the end-to-end browserless smoke path:

```bash
cd /Users/tylergee/Documents/commoncomputeai
API_BASE=http://127.0.0.1:8000 node scripts/smoke-api.mjs
```

## Deployment Shape

- Cloudflare handles DNS, CDN, and edge delivery.
- AWS hosts the FastAPI backend, queue workers, database, and artifact storage.
- `API_BASE_URL` should be set on the rendered site if the API is on a different origin.
