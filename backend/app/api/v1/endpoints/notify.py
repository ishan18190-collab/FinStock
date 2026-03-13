from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.services.notify_service import NotifyService

router = APIRouter(prefix="/notify", tags=["notify"])
notify_service = NotifyService()


class SendReportRequest(BaseModel):
    phone_number: str
    pdf_url: str          # must be a publicly accessible URL
    message: str = "Here is your FinStock statistics report 📊"


@router.post("/send-report")
async def send_report(body: SendReportRequest, background_tasks: BackgroundTasks):
    """Send a PDF report to a single verified user over WhatsApp."""
    user = notify_service.get_user(body.phone_number)
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sign up first.")
    if not user["is_verified"]:
        raise HTTPException(status_code=403, detail="Phone number not verified.")

    background_tasks.add_task(
        notify_service.send_whatsapp,
        body.phone_number,
        body.message,
        body.pdf_url
    )
    return {"message": f"Report queued for {body.phone_number}"}


@router.post("/broadcast-report")
async def broadcast_report(
    pdf_url: str,
    background_tasks: BackgroundTasks,
    message: str = "Here is your FinStock statistics report 📊",
):
    """Send PDF report to ALL verified users."""
    users = notify_service.get_all_verified_users()
    if not users:
        return {"message": "No verified users found."}

    for user in users:
        background_tasks.add_task(
            notify_service.send_whatsapp,
            user["phone_number"],
            message,
            pdf_url
        )
    return {"message": f"Report queued for {len(users)} users"}
