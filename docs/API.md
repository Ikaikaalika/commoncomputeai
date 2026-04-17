# API Surface

Base URLs:

- `http://127.0.0.1:8000` for local development
- your deployed AWS-backed FastAPI host

Website routes:

- `GET /`
- `GET /providers`
- `GET /developers`
- `GET /pricing`
- `GET /security`
- `GET /download`
- `GET /docs`
- `GET /about`
- `GET /blog`
- `GET /status`
- `GET /privacy`
- `GET /terms`
- `GET /support`
- `GET /careers`
- `GET /api-docs`

## Auth

- `POST /auth/register`
- `POST /auth/login`

## Providers

- `GET /providers/me`
- `POST /providers/devices`
- `GET /providers/ledger`

## Customers

- `GET /customers/me`
- `POST /customers/jobs`
- `GET /customers/jobs/{job_id}`

## Worker

- `POST /worker/poll`
- `POST /worker/tasks/{task_id}/complete`

## Health

- `GET /healthz`

## Local Notes

- Set `API_BASE_URL` if the website is served from a different origin than the API.
- Use `DATABASE_PATH` to point local dev at a temporary SQLite file.
