import sqlite3
from pathlib import Path
from typing import Optional

from twilio.rest import Client

from app.core.config import get_settings

DB_PATH = Path(__file__).resolve().parents[3] / "financial_forensics.db"


def _get_twilio_client():
    settings = get_settings()
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def _get_whatsapp_from() -> str:
    return get_settings().twilio_whatsapp_from


class NotifyService:

    async def send_whatsapp(
        self, phone_number: str, message: str, pdf_url: Optional[str] = None
    ) -> dict:
        """Send a WhatsApp message to a single number."""
        client = _get_twilio_client()
        body = message
        if pdf_url:
            body += f"\n\n📄 Download your report: {pdf_url}"

        msg = client.messages.create(
            from_=_get_whatsapp_from(),
            to=f"whatsapp:{phone_number}",
            body=body,
        )
        return {"status": msg.status, "sid": msg.sid, "to": phone_number}

    async def broadcast_whatsapp(
        self, message: str, pdf_url: Optional[str] = None
    ) -> dict:
        """Send a WhatsApp message to all verified users."""
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT phone_number FROM users WHERE is_verified = 1"
        ).fetchall()
        conn.close()

        if not rows:
            return {"status": "no_verified_users", "sent": 0}

        results = []
        for (phone_number,) in rows:
            try:
                result = await self.send_whatsapp(phone_number, message, pdf_url)
                results.append({"phone": phone_number, "status": result["status"]})
            except Exception as e:
                results.append({"phone": phone_number, "status": "failed", "error": str(e)})

        return {"sent": len(rows), "results": results}
