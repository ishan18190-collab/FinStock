import sqlite3
import os
from pathlib import Path

from twilio.rest import Client

from app.core.config import get_settings

# DB path — same file as the rest of the app
DB_PATH = Path(__file__).resolve().parents[3] / "financial_forensics.db"


def _get_twilio_client():
    settings = get_settings()
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def _get_verify_sid() -> str:
    return get_settings().twilio_verify_sid


def _init_db():
    """Create users table if it doesn't already exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            is_verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


class AuthService:
    def __init__(self):
        _init_db()

    async def send_otp(self, phone_number: str) -> dict:
        """Send OTP via Twilio Verify SMS."""
        client = _get_twilio_client()
        verification = client.verify.v2.services(
            _get_verify_sid()
        ).verifications.create(
            to=phone_number,
            channel="sms"
        )
        return {"status": verification.status, "phone_number": phone_number}

    async def verify_otp(self, phone_number: str, otp: str) -> dict:
        """Verify OTP and save/update user in DB."""
        client = _get_twilio_client()
        check = client.verify.v2.services(
            _get_verify_sid()
        ).verification_checks.create(
            to=phone_number,
            code=otp
        )

        if check.status != "approved":
            raise ValueError(f"OTP verification failed: status={check.status}")

        # Upsert user as verified
        conn = sqlite3.connect(DB_PATH)
        conn.execute("""
            INSERT INTO users (phone_number, is_verified)
            VALUES (?, 1)
            ON CONFLICT(phone_number) DO UPDATE SET is_verified = 1
        """, (phone_number,))
        conn.commit()

        row = conn.execute(
            "SELECT id, phone_number, is_verified, created_at FROM users WHERE phone_number = ?",
            (phone_number,)
        ).fetchone()
        conn.close()

        return {
            "status": "verified",
            "user": {
                "id": row[0],
                "phone_number": row[1],
                "is_verified": bool(row[2]),
                "created_at": row[3],
            }
        }

    async def get_all_users(self) -> list:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT id, phone_number, is_verified, created_at FROM users ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        return [
            {"id": r[0], "phone_number": r[1], "is_verified": bool(r[2]), "created_at": r[3]}
            for r in rows
        ]
