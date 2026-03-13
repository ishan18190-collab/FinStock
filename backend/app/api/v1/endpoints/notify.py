from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.notify_service import NotifyService

router = APIRouter(prefix="/notify", tags=["notify"])
notify_service = NotifyService()


class SendReportRequest(BaseModel):
    phone_number: str  # e.g. +919876543210
    message: str = "Here is your FinStock report!"
    pdf_url: Optional[str] = None  # Public URL to a PDF (optional)


@router.post("/send-report")
async def send_report(req: SendReportRequest):
    """Send a WhatsApp message (with optional PDF link) to a single user."""
    try:
        result = await notify_service.send_whatsapp(
            req.phone_number, req.message, req.pdf_url
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcast-report")
async def broadcast_report(req: SendReportRequest):
    """Send a WhatsApp message to ALL verified users in the DB."""
    try:
        result = await notify_service.broadcast_whatsapp(req.message, req.pdf_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
