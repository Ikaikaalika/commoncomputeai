from __future__ import annotations

import json
from datetime import datetime

from app.db import get_conn


def create_tasks_for_job(job_id: int, workload_type: str, total_tasks: int, price_cents: int) -> None:
    provider_share = max(int(price_cents * 0.65 / total_tasks), 1)
    with get_conn() as conn:
        for index in range(total_tasks):
            payload = {
                "task_index": index,
                "instructions": f"Process {workload_type} task chunk {index + 1} for job {job_id}",
            }
            conn.execute(
                """
                INSERT INTO tasks (job_id, workload_type, payload_json, payout_cents)
                VALUES (?, ?, ?, ?)
                """,
                (job_id, workload_type, json.dumps(payload), provider_share),
            )


def claim_next_task(device_id: int):
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        task = conn.execute(
            """
            SELECT *
            FROM tasks
            WHERE status = 'queued'
            ORDER BY id ASC
            LIMIT 1
            """
        ).fetchone()
        if not task:
            return None

        conn.execute(
            "UPDATE tasks SET status = 'running', assigned_device_id = ?, started_at = ? WHERE id = ?",
            (device_id, now, task["id"]),
        )
        conn.execute(
            "UPDATE devices SET status = 'busy', last_seen_at = ? WHERE id = ?",
            (now, device_id),
        )
        return dict(task)


def complete_task(task_id: int, result_uri: str | None = None):
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not task:
            return None

        conn.execute(
            "UPDATE tasks SET status = 'completed', completed_at = ?, result_uri = ? WHERE id = ?",
            (now, result_uri, task_id),
        )
        if task["assigned_device_id"]:
            conn.execute(
                "UPDATE devices SET status = 'idle', last_seen_at = ? WHERE id = ?",
                (now, task["assigned_device_id"]),
            )
            device = conn.execute("SELECT * FROM devices WHERE id = ?", (task["assigned_device_id"],)).fetchone()
            if device:
                conn.execute(
                    """
                    INSERT INTO ledger_entries (user_id, entry_type, amount_cents, reference_type, reference_id, note)
                    VALUES (?, 'provider_earning', ?, 'task', ?, ?)
                    """,
                    (
                        device["user_id"],
                        task["payout_cents"],
                        task_id,
                        f"Task {task_id} completed",
                    ),
                )

        conn.execute(
            "UPDATE jobs SET completed_tasks = completed_tasks + 1 WHERE id = ?",
            (task["job_id"],),
        )
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (task["job_id"],)).fetchone()
        if job and job["completed_tasks"] >= job["total_tasks"]:
            conn.execute("UPDATE jobs SET status = 'completed' WHERE id = ?", (task["job_id"],))
        else:
            conn.execute("UPDATE jobs SET status = 'running' WHERE id = ?", (task["job_id"],))
        return dict(task)
