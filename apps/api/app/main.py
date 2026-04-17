from __future__ import annotations

from pathlib import Path

from starlette import routing as starlette_routing

_router_init = starlette_routing.Router.__init__


def _router_init_compat(self, *args, on_startup=None, on_shutdown=None, **kwargs):
    # Starlette 1.0 drops startup/shutdown kwargs; FastAPI 0.116 still passes them here.
    return _router_init(self, *args, **kwargs)


starlette_routing.Router.__init__ = _router_init_compat

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routers import auth, customers, pages, providers, worker

for router in (pages.router, auth.router, providers.router, customers.router, worker.router):
    if not hasattr(router, "on_startup"):
        router.on_startup = []
    if not hasattr(router, "on_shutdown"):
        router.on_shutdown = []

app = FastAPI(title="Common Commute API", version="0.1.0")

APP_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")
app.state.db_initialized = False


@app.middleware("http")
async def ensure_database(request, call_next):
    if not app.state.db_initialized:
        # Keep local SQLite bootstrap idempotent because startup hooks are not reliable in this combo.
        init_db()
        app.state.db_initialized = True
    return await call_next(request)


@app.get("/healthz")
def healthcheck():
    return {"status": "ok"}


app.include_router(pages.router)
app.include_router(auth.router)
app.include_router(providers.router)
app.include_router(customers.router)
app.include_router(worker.router)
