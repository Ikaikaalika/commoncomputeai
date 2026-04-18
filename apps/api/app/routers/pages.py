from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["pages"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

NAV_LINKS = [
    {"href": "/", "label": "Home"},
    {"href": "/providers", "label": "For Mac Owners"},
    {"href": "/developers", "label": "For Developers"},
    {"href": "/pricing", "label": "Pricing"},
    {"href": "/security", "label": "Security"},
    {"href": "/docs", "label": "Docs"},
    {"href": "/download", "label": "Download"},
]

FOOTER_LINKS = [
    {"href": "/about", "label": "About"},
    {"href": "/blog", "label": "Blog"},
    {"href": "/status", "label": "Status"},
    {"href": "/privacy", "label": "Privacy"},
    {"href": "/terms", "label": "Terms"},
    {"href": "/support", "label": "Support"},
    {"href": "/careers", "label": "Careers"},
]


def page_context(
    request: Request,
    *,
    page_title: str,
    page_description: str,
    active_page: str,
    page_path: str,
    **extra: object,
) -> dict[str, object]:
    return {
        "request": request,
        "api_base_url": os.getenv("API_BASE_URL", "").rstrip("/"),
        "page_title": page_title,
        "page_description": page_description,
        "active_page": active_page,
        "page_path": page_path,
        "nav_links": NAV_LINKS,
        "footer_links": FOOTER_LINKS,
        **extra,
    }


def render(template: str, **context: object):
    request = context["request"]
    return templates.TemplateResponse(request, template, context)


@router.get("/", response_class=HTMLResponse)
def landing(request: Request):
    return render(
        "index.html",
        **page_context(
            request,
            page_title="Common Compute | Affordable AI compute powered by idle Macs",
            page_description="Run verified batch AI workloads for less or earn from the Apple Silicon you already own.",
            active_page="home",
            page_path="/",
        ),
    )


@router.get("/providers", response_class=HTMLResponse)
def providers_page(request: Request):
    return render(
        "providers.html",
        **page_context(
            request,
            page_title="For Mac Owners | Common Compute",
            page_description="Put your Mac's idle time to work on your schedule and earn when verified jobs complete.",
            active_page="providers",
            page_path="/providers",
        ),
    )


@router.get("/developers", response_class=HTMLResponse)
def developers_page(request: Request):
    return render(
        "developers.html",
        **page_context(
            request,
            page_title="For Developers | Common Compute",
            page_description="Run batch inference and preprocessing workloads at lower cost through the dashboard or API.",
            active_page="developers",
            page_path="/developers",
        ),
    )


@router.get("/pricing", response_class=HTMLResponse)
def pricing_page(request: Request):
    return render(
        "pricing.html",
        **page_context(
            request,
            page_title="Pricing | Common Compute",
            page_description="Pay for completed work, not idle infrastructure.",
            active_page="pricing",
            page_path="/pricing",
        ),
    )


@router.get("/security", response_class=HTMLResponse)
def security_page(request: Request):
    return render(
        "security.html",
        **page_context(
            request,
            page_title="Security | Common Compute",
            page_description="Security and verification built into every job.",
            active_page="security",
            page_path="/security",
        ),
    )


@router.get("/download", response_class=HTMLResponse)
def download(request: Request):
    return render(
        "download.html",
        **page_context(
            request,
            page_title="Download | Common Compute",
            page_description="Download Common Compute for Mac.",
            active_page="download",
            page_path="/download",
        ),
    )


@router.get("/docs", response_class=HTMLResponse)
def docs_page(request: Request):
    return render(
        "docs.html",
        **page_context(
            request,
            page_title="Docs | Common Compute",
            page_description="Getting started, provider setup, developer API, verification, scheduling, earnings, and security.",
            active_page="docs",
            page_path="/docs",
        ),
    )


@router.get("/about", response_class=HTMLResponse)
def about_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="About | Common Compute",
            page_description="Common Compute is building a trusted distributed compute network powered by idle Macs.",
            active_page="about",
            page_path="/about",
            eyebrow="About",
            headline="Common Compute is building a trusted distributed compute network powered by idle Macs.",
            lead="The product is designed for affordable batch AI workloads, fair provider payouts, and clear execution controls.",
            cta_primary={"label": "Download", "href": "/download"},
            cta_secondary={"label": "For developers", "href": "/developers"},
            cards=[
                {"title": "Trust", "body": "Transparent usage, verified work, and no hidden background activity."},
                {"title": "Efficiency", "body": "Lower-cost AI execution that uses existing hardware better."},
                {"title": "Fairness", "body": "A marketplace that works for both compute providers and buyers."},
            ],
        ),
    )


@router.get("/blog", response_class=HTMLResponse)
def blog_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="Blog | Common Compute",
            page_description="Product notes, release updates, and launch documentation.",
            active_page="blog",
            page_path="/blog",
            eyebrow="Blog",
            headline="Release notes, launch updates, and product writing.",
            lead="The blog will carry short updates on shipping, benchmarks, security, and marketplace progress.",
            cta_primary={"label": "Read docs", "href": "/docs"},
            cta_secondary={"label": "View status", "href": "/status"},
            cards=[
                {"title": "Launch notes", "body": "What changed, what shipped, and what is next."},
                {"title": "Benchmarks", "body": "Updates on workload types, performance, and pricing direction."},
                {"title": "Product writing", "body": "Clear explanations of the platform and its tradeoffs."},
            ],
        ),
    )


@router.get("/status", response_class=HTMLResponse)
def status_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="Status | Common Compute",
            page_description="Operational status and system notes.",
            active_page="status",
            page_path="/status",
            eyebrow="Status",
            headline="Operational status and system notes.",
            lead="This page should become the source of truth for uptime, incidents, and scheduled maintenance.",
            cta_primary={"label": "Read security", "href": "/security"},
            cta_secondary={"label": "Contact support", "href": "/support"},
            cards=[
                {"title": "Platform", "body": "Operational", "note": "No current incidents."},
                {"title": "Jobs", "body": "Verified execution enabled", "note": "Retries and completion checks active."},
                {"title": "Mac app", "body": "Downloadable", "note": "Developer ID signing and notarization required."},
            ],
        ),
    )


@router.get("/privacy", response_class=HTMLResponse)
def privacy_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="Privacy | Common Compute",
            page_description="Privacy principles for the Common Compute marketplace.",
            active_page="privacy",
            page_path="/privacy",
            eyebrow="Privacy",
            headline="Privacy by default.",
            lead="The platform should explain what runs, when it runs, and what data is handled so users can make an informed choice.",
            cta_primary={"label": "View terms", "href": "/terms"},
            cta_secondary={"label": "Download", "href": "/download"},
            cards=[
                {"title": "Control", "body": "Providers choose when their machine is available for work."},
                {"title": "Scope", "body": "Only approved workloads should run inside the execution environment."},
                {"title": "Transparency", "body": "Usage, earnings, and task completion should be visible."},
            ],
        ),
    )


@router.get("/terms", response_class=HTMLResponse)
def terms_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="Terms | Common Compute",
            page_description="Marketplace terms and service rules.",
            active_page="terms",
            page_path="/terms",
            eyebrow="Terms",
            headline="Simple service rules for a practical marketplace.",
            lead="The terms page should define provider responsibilities, customer obligations, and service limits in plain English.",
            cta_primary={"label": "Read privacy", "href": "/privacy"},
            cta_secondary={"label": "Get support", "href": "/support"},
            cards=[
                {"title": "Providers", "body": "Set limits, keep the app current, and run approved workloads only."},
                {"title": "Customers", "body": "Submit valid jobs, respect verification outcomes, and pay for completed work."},
                {"title": "Platform", "body": "Operate the marketplace honestly and keep the rules visible."},
            ],
        ),
    )


@router.get("/support", response_class=HTMLResponse)
def support_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="Support | Common Compute",
            page_description="Support options for providers and developers.",
            active_page="support",
            page_path="/support",
            eyebrow="Support",
            headline="Help for providers, developers, and evaluators.",
            lead="Support should be direct. Keep the contact path visible, keep the onboarding docs current, and keep the answers practical.",
            cta_primary={"label": "Read docs", "href": "/docs"},
            cta_secondary={"label": "Download", "href": "/download"},
            cards=[
                {"title": "Email", "body": "support@commoncompute.ai"},
                {"title": "Onboarding", "body": "Follow the provider setup and developer API docs first."},
                {"title": "FAQ", "body": "Most launch questions should be answered on the download and security pages."},
            ],
        ),
    )


@router.get("/careers", response_class=HTMLResponse)
def careers_page(request: Request):
    return render(
        "content_page.html",
        **page_context(
            request,
            page_title="Careers | Common Compute",
            page_description="Careers later.",
            active_page="careers",
            page_path="/careers",
            eyebrow="Careers",
            headline="Hiring later.",
            lead="The company is not framing itself as a recruiting site yet. This page exists to keep the sitemap complete and can grow into openings later.",
            cta_primary={"label": "Home", "href": "/"},
            cards=[
                {"title": "Product", "body": "Build a system that is trustworthy enough for both providers and customers."},
                {"title": "Infrastructure", "body": "Ship practical tooling for Mac owners and batch AI developers."},
                {"title": "Later", "body": "Open roles can land here when the team is ready."},
            ],
        ),
    )

