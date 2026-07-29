"""Payment routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user, get_payment_service
from backend.schemas import PaymentCreateRequest, PaymentRead
from backend.services import AuthenticatedUser, PaymentService

router = APIRouter(tags=["Payments"])


@router.post("/payment", response_model=PaymentRead)
def create_payment(
    payload: PaymentCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Create a payment for the authenticated user's pending order."""

    return PaymentRead.model_validate(payment_service.create_payment(current_user, payload.order_id, payload.card_last4))