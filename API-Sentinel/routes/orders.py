"""Order access routes with ownership enforcement."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from backend.dependencies import get_current_user, get_order_service
from backend.schemas import OrderRead
from backend.services import AuthenticatedUser, OrderService
from modules.bola_detector import enforce_order_ownership

router = APIRouter(tags=["Orders"])


@router.get("/orders", response_model=list[OrderRead])
def list_orders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
    status_filter: str | None = Query(default=None, alias="status"),
):
    """List the authenticated user's orders."""

    return [OrderRead.model_validate(order) for order in order_service.list_orders(current_user, status_filter)]


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(
    order_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    order_service: OrderService = Depends(get_order_service),
):
    """Return a single order after enforcing object ownership."""

    order = order_service.get_order(current_user, order_id)
    enforce_order_ownership(order=order, current_user=current_user)
    return OrderRead.model_validate(order)