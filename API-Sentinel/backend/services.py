"""Business logic and orchestration services."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.auth import create_access_token, verify_password
from backend.models import Alert, Order, Payment, User
from backend.repositories import AlertRepository, InventoryRepository, OrderRepository, PaymentRepository, RequestLogRepository, UserRepository


@dataclass(frozen=True)
class AuthenticatedUser:
    """Minimal authenticated identity used by dependencies and middleware."""

    id: int
    public_id: str
    username: str
    role: str


class AuthService:
    """Authenticate users and issue JWT access tokens."""

    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def login(self, *, username: str, password: str) -> tuple[User, str]:
        user = self.users.get_by_username(username.strip())
        if user is None or not user.is_active or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

        token = create_access_token(subject=user.public_id, username=user.username, role=user.role)
        return user, token


class UserService:
    """User profile and account lifecycle operations."""

    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def get_profile(self, current_user: AuthenticatedUser) -> User:
        user = self.users.get_by_public_id(current_user.public_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def delete_account(self, current_user: AuthenticatedUser) -> None:
        user = self.users.get_by_public_id(current_user.public_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        self.users.delete(user)


class OrderService:
    """Order retrieval and ownership enforcement."""

    def __init__(self, orders: OrderRepository, alerts: AlertRepository) -> None:
        self.orders = orders
        self.alerts = alerts

    def list_orders(self, current_user: AuthenticatedUser, status_filter: str | None = None) -> list[Order]:
        return self.orders.list_for_user(current_user.id, status_filter)

    def get_order(self, current_user: AuthenticatedUser, order_public_id: str) -> Order:
        order = self.orders.get_by_public_id(order_public_id)
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this order is not allowed")
        return order


class PaymentService:
    """Validate and create payments for authenticated users."""

    def __init__(self, orders: OrderRepository, payments: PaymentRepository) -> None:
        self.orders = orders
        self.payments = payments

    def create_payment(self, current_user: AuthenticatedUser, order_public_id: str, card_last4: str) -> Payment:
        order = self.orders.get_by_public_id(order_public_id)
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot pay for another user's order")
        if order.status != "pending":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order is not payable")
        if self.payments.get_by_order_id(order.id) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order already has a payment")

        payment = Payment(
            public_id=f"pay_{order_public_id}",
            user_id=current_user.id,
            order_id=order.id,
            amount=order.total_amount,
            card_last4=card_last4,
            status="completed",
        )
        self.payments.create(payment)
        order.status = "completed"
        return payment


class AlertService:
    """Central alert orchestration."""

    def __init__(self, alerts: AlertRepository) -> None:
        self.alerts = alerts

    def raise_alert(
        self,
        *,
        severity: str,
        detector: str,
        description: str,
        risk_score: int = 0,
        evidence: dict[str, Any] | None = None,
        recommendation: str = "",
        user_id: int | None = None,
        username: str | None = None,
        ip_address: str | None = None,
        endpoint: str | None = None,
    ) -> Alert:
        alert = Alert(
            alert_id=f"al_{severity.lower()}_{detector.lower()}_{risk_score}_{abs(hash(description)) & 0xFFFF_FFFF:x}",
            severity=severity,
            detector=detector,
            description=description,
            risk_score=risk_score,
            evidence=evidence or {},
            recommendation=recommendation,
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            endpoint=endpoint,
        )
        self.alerts.create(alert)
        return alert


class InventoryService:
    """Maintain known, discovered, and deprecated API inventory state."""

    def __init__(self, inventory: InventoryRepository) -> None:
        self.inventory = inventory

    def seed_endpoint(self, endpoint: str, *, category: str = "known", status: str = "known", notes: str = "", risk_score: int = 0) -> None:
        self.inventory.upsert(endpoint=endpoint, category=category, status=status, notes=notes, risk_score=risk_score)

    def record_hit(self, endpoint: str, *, category: str, status: str, risk_score: int = 0, notes: str = ""):
        return self.inventory.upsert(endpoint=endpoint, category=category, status=status, risk_score=risk_score, notes=notes)


class RequestLogService:
    """Persist request telemetry entries."""

    def __init__(self, logs: RequestLogRepository) -> None:
        self.logs = logs

    def create_log(self, log_entry):
        return self.logs.create(log_entry)