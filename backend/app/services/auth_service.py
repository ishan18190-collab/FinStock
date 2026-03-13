import sqlite3
import os
from datetime import datetime

from twilio.rest import Client

# Reuse the same DB your project already uses
DB_PATH = os.path.join(os.path.dirname(__file__), "../../financial_forensics.db")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_VERIFY_SID  = os.getenv("TWILIO_VERIFY_SID")


def _get_db():
    """Get a SQLite connection to the existing financial_forensics.db."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


def _ensure_users_table():
    """Create users table if it doesn't exist yet."""
    conn = _get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            is_verified  INTEGER DEFAULT 0,
            created_at   TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


class AuthService:
    def __init__(self):
        _ensure_users_table()
        self.twilio = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    async def send_otp(self, phone_number: str) -> dict:
        """Send OTP via Twilio Verify."""
        try:
            self.twilio.verify.v2.services(
                TWILIO_VERIFY_SID
            ).verifications.create(
                to=phone_number,
                channel="sms"
            )
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def verify_otp(self, phone_number: str, otp: str) -> dict:
        """Check OTP with Twilio, then upsert user into SQLite."""
        # 1. Verify OTP
        try:
            check = self.twilio.verify.v2.services(
                TWILIO_VERIFY_SID
            ).verification_checks.create(
                to=phone_number,
                code=otp
            )
        except Exception as e:
            return {"success": False, "error": str(e)}

        if check.status != "approved":
            return {"success": False, "error": "Invalid or expired OTP"}

        # 2. Upsert user into DB
        try:
            conn = _get_db()
            conn.execute("""
                INSERT INTO users (phone_number, is_verified)
                VALUES (?, 1)
                ON CONFLICT(phone_number)
                DO UPDATE SET is_verified = 1
            """, (phone_number,))
            conn.commit()

            row = conn.execute(
                "SELECT id, phone_number, is_verified, created_at FROM users WHERE phone_number = ?",
                (phone_number,)
            ).fetchone()
            conn.close()

            return {
                "success": True,
                "user": {
                    "id": row["id"],
                    "phone_number": row["phone_number"],
                    "is_verified": bool(row["is_verified"]),
                    "created_at": row["created_at"],
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
