import os
import sqlite3

from twilio.rest import Client

DB_PATH = os.path.join(os.path.dirname(__file__), "../../financial_forensics.db")

TWILIO_ACCOUNT_SID   = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN    = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")


def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class NotifyService:
    def __init__(self):
        self.twilio = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    def get_user(self, phone_number: str) -> dict | None:
        conn = _get_db()
        row = conn.execute(
            "SELECT phone_number, is_verified FROM users WHERE phone_number = ?",
            (phone_number,)
        ).fetchone()
        conn.close()
        if not row:
            return None
        return {"phone_number": row["phone_number"], "is_verified": bool(row["is_verified"])}

    def get_all_verified_users(self) -> list:
        conn = _get_db()
        rows = conn.execute(
            "SELECT phone_number FROM users WHERE is_verified = 1"
        ).fetchall()
        conn.close()
        return [{"phone_number": row["phone_number"]} for row in rows]

    def send_whatsapp(self, phone_number: str, message: str, pdf_url: str):
        """Send WhatsApp message with PDF attachment via Twilio."""
        self.twilio.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{phone_number}",
            body=message,
            media_url=[pdf_url]
        )
