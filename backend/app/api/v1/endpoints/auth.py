from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()


class SendOTPRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)


class VerifyOTPRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=4, max_length=8)


def _err_detail(e: Exception) -> str:
    s = str(e)
    return s if s and len(s) < 200 else "Request failed. Please try again."


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest):
    """Send OTP to phone number via Twilio Verify (SMS)."""
    try:
        result = await auth_service.send_otp(req.phone_number)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=_err_detail(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=_err_detail(e))


@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    """Verify OTP and save verified user to DB."""
    try:
        result = await auth_service.verify_otp(req.phone_number, req.otp)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=_err_detail(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=_err_detail(e))


@router.get("/users")
async def list_users():
    """List all verified users (admin use)."""
    try:
        return await auth_service.get_all_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
