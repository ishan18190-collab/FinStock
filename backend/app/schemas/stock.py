from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)


class ChatResponse(BaseModel):
    answer: str
    source: str = "fallback"


class ReportResponse(BaseModel):
    symbol: str
    report_markdown: str


class SummarizeResponse(BaseModel):
    symbol: str
    summary: str


class WhatsAppReportRequest(BaseModel):
    level: str = Field(..., pattern="^(beginner|intermediate|pro)$")
    phone_number: str = Field(..., min_length=10, max_length=15)
