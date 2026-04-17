from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.schemas import JobCreateRequest, JobResponse
from app.services.auth import get_current_user, require_role
from app.services.scheduler import create_tasks_for_job

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/me")
def customer_me(user=Depends(get_current_user)):
    require_role(user, "customer")
    with get_conn() as conn:
        jobs = conn.execute("SELECT * FROM jobs WHERE customer_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    return {"user": dict(user), "jobs": [dict(job) for job in jobs]}


@router.post("/jobs", response_model=JobResponse)
def create_job(payload: JobCreateRequest, user=Depends(get_current_user)):
    require_role(user, "customer")
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO jobs (customer_id, workload_type, title, input_uri, price_cents, total_tasks)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user["id"], payload.workload_type, payload.title, payload.input_uri, payload.price_cents, payload.total_tasks),
        )
        job_id = cursor.lastrowid
        conn.execute(
            """
            INSERT INTO ledger_entries (user_id, entry_type, amount_cents, reference_type, reference_id, note)
            VALUES (?, 'customer_charge', ?, 'job', ?, ?)
            """,
            (user["id"], -payload.price_cents, job_id, f"Charge for job {job_id}"),
        )

    create_tasks_for_job(job_id=job_id, workload_type=payload.workload_type, total_tasks=payload.total_tasks, price_cents=payload.price_cents)

    with get_conn() as conn:
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return JobResponse(**dict(job))


@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: int, user=Depends(get_current_user)):
    require_role(user, "customer")
    with get_conn() as conn:
        job = conn.execute("SELECT * FROM jobs WHERE id = ? AND customer_id = ?", (job_id, user["id"])).fetchone()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**dict(job))
