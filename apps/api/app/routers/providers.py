from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db import get_conn
from app.schemas import DeviceCreateRequest, LedgerEntryResponse
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/me")
def provider_me(user=Depends(get_current_user)):
    require_role(user, "provider")
    with get_conn() as conn:
        devices = conn.execute("SELECT * FROM devices WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
        ledger = conn.execute(
            "SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY id DESC LIMIT 20", (user["id"],)
        ).fetchall()
    return {
        "user": dict(user),
        "devices": [dict(d) for d in devices],
        "ledger": [dict(entry) for entry in ledger],
    }


@router.post("/devices")
def create_device(payload: DeviceCreateRequest, user=Depends(get_current_user)):
    require_role(user, "provider")
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO devices (user_id, name, cpu_cores, memory_gb, gpu_class)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user["id"], payload.name, payload.cpu_cores, payload.memory_gb, payload.gpu_class),
        )
        device_id = cursor.lastrowid
        device = conn.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).fetchone()
    return dict(device)


@router.get("/ledger", response_model=list[LedgerEntryResponse])
def provider_ledger(user=Depends(get_current_user)):
    require_role(user, "provider")
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY id DESC", (user["id"],)).fetchall()
    return [LedgerEntryResponse(**dict(row)) for row in rows]
