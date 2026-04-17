from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

EmailLike = str


Role = Literal["provider", "customer", "admin"]
WorkloadType = Literal["embeddings", "transcription", "ocr", "video"]


class RegisterRequest(BaseModel):
    email: EmailLike = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8)
    full_name: str
    role: Role


class LoginRequest(BaseModel):
    email: EmailLike = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    role: Role
    full_name: str


class DeviceCreateRequest(BaseModel):
    name: str
    cpu_cores: int = Field(ge=1)
    memory_gb: int = Field(ge=1)
    gpu_class: str


class JobCreateRequest(BaseModel):
    title: str
    workload_type: WorkloadType
    price_cents: int = Field(ge=100)
    total_tasks: int = Field(default=1, ge=1, le=1000)
    input_uri: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    workload_type: WorkloadType
    status: str
    price_cents: int
    total_tasks: int
    completed_tasks: int


class WorkerPollRequest(BaseModel):
    device_id: int


class TaskCompleteRequest(BaseModel):
    result_uri: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    job_id: int
    status: str
    workload_type: str
    payload_json: str
    payout_cents: int


class LedgerEntryResponse(BaseModel):
    id: int
    entry_type: str
    amount_cents: int
    reference_type: str
    reference_id: int | None
    note: str | None
    created_at: str
