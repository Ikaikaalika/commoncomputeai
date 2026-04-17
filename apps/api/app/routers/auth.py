from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import get_conn
from app.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
    with get_conn() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")

        cursor = conn.execute(
            "INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
            (payload.email, hash_password(payload.password), payload.role, payload.full_name),
        )
        user_id = cursor.lastrowid
        token = create_token()
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))

    return AuthResponse(token=token, user_id=user_id, role=payload.role, full_name=payload.full_name)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    with get_conn() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
        if not user or not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_token()
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))

    return AuthResponse(
        token=token,
        user_id=user["id"],
        role=user["role"],
        full_name=user["full_name"],
    )
