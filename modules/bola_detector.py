"""Broken Object Level Authorization detection and enforcement."""

from __future__ import annotations

from fastapi import HTTPException, status

from backend.services import AuthenticatedUser
from modules.alert_engine import emit_alert
from modules.bola_engine import detect_bola_attack


def enforce_order_ownership(*, order, current_user: AuthenticatedUser) -> None:
    """Block access when a user attempts to read another user's order."""

    if order.user_id == current_user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Broken Object Level Authorization prevented: access denied",
    )


def detect_bola_attempt(*, db, order, current_user: AuthenticatedUser, ip_address: str | None = None, request_id: str = ""):
    """Emit a BOLA alert for a cross-user object access attempt."""

    if order.user_id == current_user.id:
        return None

    detection = detect_bola_attack(
        user_id=current_user.id,
        object_id=str(getattr(order, "public_id", order.id)),
        object_type="order",
        endpoint=f"/orders/{getattr(order, 'public_id', order.id)}",
        action="GET",
        role=current_user.role,
        owner_id=order.user_id,
    )

    evidence = {
        "request_id": request_id,
        "order_public_id": order.public_id,
        "order_owner_id": order.user_id,
        "requester_id": current_user.id,
    }
    return emit_alert(
        db=db,
        severity="CRITICAL",
        detector="BOLADetector",
        description="Broken Object Level Authorization attempt blocked",
        risk_score=int(detection["risk_score"] or 95),
        evidence=evidence,
        recommendation="Enforce ownership checks before object access and log the event for incident response.",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=ip_address,
        endpoint=f"/orders/{order.public_id}",
    )