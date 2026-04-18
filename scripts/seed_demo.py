"""Seed a tiny local demo dataset for Common Compute."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "apps" / "api"
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.db import init_db, get_conn
from app.security import hash_password


def main() -> None:
    init_db()
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
            ("provider@demo.com", hash_password("password123"), "provider", "Demo Provider"),
        )
        conn.execute(
            "INSERT OR IGNORE INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
            ("customer@demo.com", hash_password("password123"), "customer", "Demo Customer"),
        )
    print("Seeded demo users.")


if __name__ == "__main__":
    main()
