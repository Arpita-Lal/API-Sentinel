"""Pydantic schemas for API requests and responses."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class APIModel(BaseModel):
    """Shared Pydantic configuration."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class UserRead(APIModel):
    id: int
    public_id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None = None


class TokenResponse(APIModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserRead


class OrderItemRead(BaseModel):
    name: str
    quantity: int = Field(ge=1)
    unit_price: Decimal = Field(ge=0)


class OrderRead(APIModel):
    id: int
    public_id: str
    user_id: int
    status: str
    total_amount: Decimal
    items: list[OrderItemRead]
    created_at: datetime


class PaymentCreateRequest(BaseModel):
    order_id: str = Field(min_length=3, max_length=64)
    card_last4: str = Field(min_length=4, max_length=4)

    @field_validator("card_last4")
    @classmethod
    def validate_card_last4(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("card_last4 must contain only digits")
        return value


class PaymentRead(APIModel):
    id: int
    public_id: str
    user_id: int
    order_id: int
    amount: Decimal
    card_last4: str
    status: str
    created_at: datetime


class RequestLogRead(APIModel):
    id: int
    request_id: str
    timestamp: datetime
    user_id: int | None
    username: str | None
    ip_address: str | None
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    request_headers: dict[str, Any]
    user_agent: str | None
    response_size_bytes: int


class AlertRead(APIModel):
    id: int
    alert_id: str
    timestamp: datetime
    severity: str
    detector: str
    user_id: int | None
    username: str | None
    ip_address: str | None
    endpoint: str | None
    description: str
    risk_score: int
    evidence: dict[str, Any]
    recommendation: str
    is_acknowledged: bool


class InventoryRead(APIModel):
    id: int
    endpoint: str
    category: str
    status: str
    first_seen_at: datetime
    last_seen_at: datetime
    hit_count: int
    risk_score: int
    notes: str


class AdminMessage(APIModel):
    message: str