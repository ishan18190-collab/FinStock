import os
import jwt
from datetime import datetime, timedelta
from typing import Optional

from supabase import create_client, Client
from app.core.config import get_settings


def _get_supabase_client() -> Client:
    settings = get_settings()
    # Raises an error if these aren't configured in .env
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("Supabase URL and Key must be defined in .env")
    return create_client(settings.supabase_url, settings.supabase_key)


class AuthService:
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
        """Send OTP via Supabase Auth (SMS)."""
        # Test number bypass
        if phone_number == "+919999999999":
            return {"status": "pending", "phone_number": phone_number, "message": "Test mode active"}

        supabase = _get_supabase_client()
        # Supabase sends OTP when you try to sign in with a phone number
        res = supabase.auth.sign_in_with_otp({"phone": phone_number})
        
        return {"status": "pending", "phone_number": phone_number, "message": "OTP sent via Supabase"}

    async def verify_otp(self, phone_number: str, otp: str) -> dict:
        """Verify OTP with Supabase Auth."""
        # Test number bypass (OTP is '000000' for test number)
        if phone_number == "+919999999999":
            if otp != "000000":
                raise ValueError("Invalid test OTP")
            
            # Mock successful login for the test number
            user_data = {
                "id": "test-uuid-000",
                "phone_number": phone_number,
                "is_verified": True,
                "created_at": str(datetime.utcnow()),
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

        # Actual Supabase Verification
        supabase = _get_supabase_client()
        res = supabase.auth.verify_otp({
            "phone": phone_number,
            "token": otp,
            "type": "sms"
        })

        if not res.user:
            raise ValueError("OTP verification failed: Invalid code or number")

        user_data = {
            "id": res.user.id,
            "phone_number": res.user.phone,
            "is_verified": True,
            "created_at": res.user.created_at,
        }
        
        # Alternatively, we could just return res.session.access_token from Supabase,
        # but to keep the frontend completely untouched we'll drop our own JWT here.
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
        # Instead of SQLite, we now pull from Supabase's auth.users or public.profiles
        supabase = _get_supabase_client()
        
        try:
            # We assume you have a public.profiles table created that mirrors auth.users
            res = supabase.table("profiles").select("*").execute()
            rows = res.data
        except Exception:
            # If the profiles table isn't set up yet, fallback to empty
            rows = []
            
        return [
            {"id": r["id"], "phone_number": r["phone_number"], "is_verified": r.get("is_verified", True), "created_at": r["created_at"]}
            for r in rows
        ]
