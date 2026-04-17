from fastapi.testclient import TestClient

from app.db import init_db
from app.main import app


def register_user(client: TestClient, role: str, email: str, full_name: str) -> dict:
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": full_name,
            "role": role,
        },
    )
    assert response.status_code == 200
    return response.json()


def test_public_pages_render(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("API_BASE_URL", "https://api.commoncommute.ai")
    init_db()
    client = TestClient(app)

    landing = client.get("/")
    provider = client.get("/provider-dashboard")
    customer = client.get("/customer-dashboard")
    download = client.get("/download")

    assert landing.status_code == 200
    assert "Common Commute" in landing.text
    assert "Affordable AI compute, powered by idle Macs." in landing.text
    assert 'window.COMMONCOMMUTE_API_BASE_URL = "https://api.commoncommute.ai";' in landing.text

    assert provider.status_code == 200
    assert "Your Mac already has spare compute. Common Commute helps it earn." in provider.text

    assert customer.status_code == 200
    assert "Run batch AI jobs for less." in customer.text

    assert download.status_code == 200
    assert "Download Common Commute for Mac." in download.text


def test_full_marketplace_flow(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    init_db()
    client = TestClient(app)

    provider = register_user(client, "provider", "provider@example.com", "Provider One")
    customer = register_user(client, "customer", "customer@example.com", "Customer One")

    provider_token = provider["token"]
    customer_token = customer["token"]

    device = client.post(
        "/providers/devices",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"name": "Mac Studio", "cpu_cores": 12, "memory_gb": 32, "gpu_class": "Apple Silicon"},
    )
    assert device.status_code == 200
    device_id = device.json()["id"]

    job = client.post(
        "/customers/jobs",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "title": "Demo embeddings job",
            "workload_type": "embeddings",
            "price_cents": 1000,
            "total_tasks": 2,
            "input_uri": "s3://demo/input.jsonl",
        },
    )
    assert job.status_code == 200
    job_id = job.json()["id"]

    first_task = client.post(
        "/worker/poll",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"device_id": device_id},
    )
    assert first_task.status_code == 200
    first_task_id = first_task.json()["task"]["id"]

    first_complete = client.post(
        f"/worker/tasks/{first_task_id}/complete",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"result_uri": "local://task/result/1"},
    )
    assert first_complete.status_code == 200

    second_task = client.post(
        "/worker/poll",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"device_id": device_id},
    )
    assert second_task.status_code == 200
    second_task_id = second_task.json()["task"]["id"]

    second_complete = client.post(
        f"/worker/tasks/{second_task_id}/complete",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"result_uri": "local://task/result/2"},
    )
    assert second_complete.status_code == 200

    final_job = client.get(
        f"/customers/jobs/{job_id}",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert final_job.status_code == 200
    assert final_job.json()["status"] == "completed"
    assert final_job.json()["completed_tasks"] == 2

    provider_me = client.get("/providers/me", headers={"Authorization": f"Bearer {provider_token}"})
    assert provider_me.status_code == 200
    assert len(provider_me.json()["ledger"]) == 2

    customer_me = client.get("/customers/me", headers={"Authorization": f"Bearer {customer_token}"})
    assert customer_me.status_code == 200
    assert len(customer_me.json()["jobs"]) == 1
