from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()


class SendOTPRequest(BaseModel):
    phone_number: str  # e.g. +919876543210


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest):
    """Send OTP to phone number via Twilio Verify (SMS)."""
    # Normalize phone
    phone = req.phone_number.strip().replace(" ", "")
    if len(phone) == 10 and not phone.startswith("+"):
        phone = f"+91{phone}"
    
    try:
        result = await auth_service.send_otp(phone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    """Verify OTP and save verified user to DB."""
    # Normalize phone
    phone = req.phone_number.strip().replace(" ", "")
    if len(phone) == 10 and not phone.startswith("+"):
        phone = f"+91{phone}"
        
    try:
        result = await auth_service.verify_otp(phone, req.otp)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def list_users():
    """List all verified users (admin use)."""
    try:
        return await auth_service.get_all_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
