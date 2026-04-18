# DEPRECATED: Legacy provider polling endpoints. Replaced by /v1/providers/connect WebSocket in apps/api-v2.
# Kept as reference; will be deleted after smoke tests pass.
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_conn
from app.schemas import TaskCompleteRequest, TaskResponse, WorkerPollRequest
from app.services.auth import get_current_user, require_role
from app.services.scheduler import claim_next_task, complete_task

router = APIRouter(prefix="/worker", tags=["worker"])


@router.post("/poll")
def poll_for_task(payload: WorkerPollRequest, user=Depends(get_current_user)):
    require_role(user, "provider")
    with get_conn() as conn:
        device = conn.execute(
            "SELECT * FROM devices WHERE id = ? AND user_id = ?", (payload.device_id, user["id"])
        ).fetchone()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    task = claim_next_task(payload.device_id)
    return {"task": task}


@router.post("/tasks/{task_id}/complete", response_model=TaskResponse)
def complete(task_id: int, payload: TaskCompleteRequest, user=Depends(get_current_user)):
    require_role(user, "provider")
    with get_conn() as conn:
        task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        device = conn.execute(
            "SELECT * FROM devices WHERE id = ? AND user_id = ?", (task["assigned_device_id"], user["id"])
        ).fetchone()
        if not device:
            raise HTTPException(status_code=403, detail="Task is not assigned to your device")

    completed = complete_task(task_id, payload.result_uri)
    if not completed:
        raise HTTPException(status_code=404, detail="Task not found")
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return TaskResponse(**dict(row))
