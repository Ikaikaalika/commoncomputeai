from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["pages"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


def page_context(request: Request, **extra: object) -> dict[str, object]:
    return {
        "request": request,
        "api_base_url": os.getenv("API_BASE_URL", "").rstrip("/"),
        **extra,
    }


@router.get("/", response_class=HTMLResponse)
def landing(request: Request):
    return templates.TemplateResponse(request, "index.html", page_context(request))


@router.get("/provider-dashboard", response_class=HTMLResponse)
def provider_dashboard(request: Request):
    return templates.TemplateResponse(request, "provider_dashboard.html", page_context(request))


@router.get("/customer-dashboard", response_class=HTMLResponse)
def customer_dashboard(request: Request):
    return templates.TemplateResponse(request, "customer_dashboard.html", page_context(request))


@router.get("/download", response_class=HTMLResponse)
def download(request: Request):
    return templates.TemplateResponse(request, "download.html", page_context(request))
