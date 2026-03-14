import re
import sqlite3
import jwt
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

from app.core.config import get_settings

# DB path — project root (same as notify_service)
DB_PATH = Path(__file__).resolve().parents[3] / "financial_forensics.db"

# Dev test number: always succeeds with OTP 000000 when Twilio is not configured
TEST_PHONE = "+919999999999"
TEST_OTP = "000000"


def _normalize_phone(raw: str) -> str:
    """Normalize to E.164 format for Indian numbers. Handles: 9876543210, 91 987..., +91 987..., 0987..."""
    s = re.sub(r"[\s\-\(\)\.]", "", raw.strip())
    if not s:
        raise ValueError("Phone number is required")
    if s.startswith("+91"):
        s = s[3:].lstrip()
    elif s.startswith("91") and len(s) == 12:
        s = s[2:]
    elif s.startswith("0"):
        s = s[1:]
    if not s.isdigit():
        raise ValueError("Phone number must contain only digits")
    if len(s) != 10:
        raise ValueError("Indian mobile numbers must be 10 digits")
    if s[0] not in "6789":
        raise ValueError("Invalid Indian mobile number")
    return f"+91{s}"


def _twilio_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and settings.twilio_verify_sid
    )


def _get_twilio_client():
    from twilio.rest import Client
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

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        settings = get_settings()
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiry_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        return encoded_jwt

    async def send_otp(self, phone_number: str) -> dict:
        """Send OTP via Twilio Verify SMS. Uses test bypass when Twilio is not configured."""
        phone = _normalize_phone(phone_number)

        # Dev/demo bypass: when Twilio not configured OR test number
        if not _twilio_configured() or phone == TEST_PHONE:
            if phone != TEST_PHONE:
                raise ValueError(
                    "SMS is not configured. Use +91 9999999999 with OTP 000000 for demo."
                )
            return {"status": "pending", "phone_number": phone, "message": "Test mode: use OTP 000000"}

        client = _get_twilio_client()
        try:
            verification = client.verify.v2.services(_get_verify_sid()).verifications.create(
                to=phone,
                channel="sms",
            )
            return {"status": verification.status, "phone_number": phone}
        except Exception as e:
            err_str = str(e)
            msg = err_str.lower()
            if "invalid" in msg or "20404" in err_str or "21211" in err_str or "21614" in err_str:
                raise ValueError("Invalid phone number for SMS.")
            if "60007" in err_str or "21608" in err_str or "unverified" in msg or "trial" in msg:
                raise ValueError(
                    "Twilio trial: Add and verify this number at console.twilio.com/phone-numbers/manage/verified "
                    "before sending OTP, or use +91 9999999999 with OTP 000000 for demo."
                )
            if "60200" in err_str or "attempt" in msg or "rate" in msg:
                raise ValueError("Too many attempts. Please try again in a few minutes.")
            if "21408" in err_str or "permission" in msg or "region" in msg:
                raise ValueError("SMS is not enabled for this region in your Twilio account.")
            raise ValueError(
                "Could not send SMS. If using Twilio trial, verify this number at console.twilio.com first. "
                "Or use +91 9999999999 / OTP 000000 for demo."
            ) from e

    async def verify_otp(self, phone_number: str, otp: str) -> dict:
        """Verify OTP and save/update user in DB."""
        phone = _normalize_phone(phone_number)
        code = otp.strip()
        if not code or len(code) < 4:
            raise ValueError("Please enter the 6-digit code sent to your phone.")

        # Dev/demo bypass
        if not _twilio_configured() or phone == TEST_PHONE:
            if phone != TEST_PHONE:
                raise ValueError("Verification is not configured. Use test number +91 9999999999.")
            if code != TEST_OTP:
                raise ValueError("Invalid code. Use 000000 for demo.")
        else:
            client = _get_twilio_client()
            try:
                check = client.verify.v2.services(_get_verify_sid()).verification_checks.create(
                    to=phone,
                    code=code,
                )
                if check.status != "approved":
                    raise ValueError("Invalid or expired code. Request a new one.")
            except Exception as e:
                err = str(e)
                if "60200" in err or "60022" in err or "60324" in err:
                    raise ValueError("Invalid or expired code. Request a new one.") from e
                if "20404" in err or "not found" in err.lower():
                    raise ValueError("Code expired. Please request a new OTP.") from e
                raise ValueError("Verification failed. Please try again.") from e

        # Upsert user as verified
        conn = sqlite3.connect(DB_PATH)
        conn.execute("""
            INSERT INTO users (phone_number, is_verified)
            VALUES (?, 1)
            ON CONFLICT(phone_number) DO UPDATE SET is_verified = 1
        """, (phone,))
        conn.commit()

        row = conn.execute(
            "SELECT id, phone_number, is_verified, created_at FROM users WHERE phone_number = ?",
            (phone,)
        ).fetchone()
        conn.close()

        user_data = {
            "id": row[0],
            "phone_number": row[1],
            "is_verified": bool(row[2]),
            "created_at": row[3],
        }
        
        access_token = self.create_access_token(
            data={"sub": str(user_data["id"]), "phone": user_data["phone_number"]}
        )

        return {
            "status": "verified",
            "user": user_data,
            "access_token": access_token,
            "token_type": "bearer"
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
