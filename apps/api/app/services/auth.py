from __future__ import annotations

from fastapi import Header, HTTPException

from app.db import get_conn


def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1]
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid session")
    return row


def require_role(user, role: str):
    if user["role"] != role:
        raise HTTPException(status_code=403, detail=f"{role} access required")
