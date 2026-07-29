"""Repository layer for database access."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from backend.models import Alert, ApiInventory, BolaAlert, BolaObservation, Order, Payment, RequestLog, User


class UserRepository:
    """Database operations for users."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_public_id(self, public_id: str) -> User | None:
        stmt = select(User).where(User.public_id == public_id)
        return self.db.scalar(stmt)

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(func.lower(User.username) == username.lower())
        return self.db.scalar(stmt)

    def list_users(self) -> list[User]:
        stmt = select(User).order_by(User.created_at.asc())
        return list(self.db.scalars(stmt))

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)


class OrderRepository:
    """Database operations for orders."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_public_id(self, public_id: str) -> Order | None:
        stmt = select(Order).where(Order.public_id == public_id)
        return self.db.scalar(stmt)

    def get_by_identifier(self, identifier: str) -> Order | None:
        order = self.get_by_public_id(identifier)
        if order is not None:
            return order

        if identifier.isdigit():
            stmt = select(Order).where(Order.id == int(identifier))
            return self.db.scalar(stmt)

        return None

    def list_for_user(self, user_id: int, status: str | None = None) -> list[Order]:
        stmt = select(Order).where(Order.user_id == user_id)
        if status:
            stmt = stmt.where(Order.status == status)
        stmt = stmt.order_by(Order.created_at.desc())
        return list(self.db.scalars(stmt))

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.flush()
        return order


class PaymentRepository:
    """Database operations for payments."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_order_id(self, order_id: int) -> Payment | None:
        stmt = select(Payment).where(Payment.order_id == order_id)
        return self.db.scalar(stmt)

    def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment


class AlertRepository:
    """Database operations for alerts."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, alert: Alert) -> Alert:
        self.db.add(alert)
        self.db.flush()
        return alert

    def list_recent(self, limit: int = 100) -> list[Alert]:
        stmt = select(Alert).order_by(Alert.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def count_since(self, since: datetime) -> int:
        stmt = select(func.count(Alert.id)).where(Alert.timestamp >= since)
        return int(self.db.scalar(stmt) or 0)


class BolaAlertRepository:
    """Database operations for BOLA alerts."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, alert: BolaAlert) -> BolaAlert:
        self.db.add(alert)
        self.db.flush()
        return alert

    def list_recent(self, limit: int = 100) -> list[BolaAlert]:
        stmt = select(BolaAlert).order_by(BolaAlert.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def list_for_user(self, user_id: int, limit: int = 100) -> list[BolaAlert]:
        stmt = select(BolaAlert).where(BolaAlert.user_id == user_id).order_by(BolaAlert.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt))


class BolaObservationRepository:
    """Database operations for normalized BOLA observations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, observation: BolaObservation) -> BolaObservation:
        self.db.add(observation)
        self.db.flush()
        return observation

    def list_recent(self, limit: int = 500) -> list[BolaObservation]:
        stmt = select(BolaObservation).order_by(BolaObservation.timestamp.asc()).limit(limit)
        return list(self.db.scalars(stmt))

    def list_for_user(self, user_id: int) -> list[BolaObservation]:
        stmt = select(BolaObservation).where(BolaObservation.user_id == user_id).order_by(BolaObservation.timestamp.asc())
        return list(self.db.scalars(stmt))


class InventoryRepository:
    """Database operations for API inventory state."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def upsert(self, *, endpoint: str, category: str, status: str, risk_score: int = 0, notes: str = "") -> ApiInventory:
        stmt = select(ApiInventory).where(ApiInventory.endpoint == endpoint, ApiInventory.category == category)
        existing = self.db.scalar(stmt)
        now = datetime.now(timezone.utc)
        if existing:
            existing.last_seen_at = now
            existing.hit_count += 1
            existing.status = status
            existing.risk_score = max(existing.risk_score, risk_score)
            if notes:
                existing.notes = notes
            self.db.flush()
            return existing

        inventory = ApiInventory(
            endpoint=endpoint,
            category=category,
            status=status,
            first_seen_at=now,
            last_seen_at=now,
            hit_count=1,
            risk_score=risk_score,
            notes=notes,
        )
        self.db.add(inventory)
        self.db.flush()
        return inventory

    def list_by_category(self, category: str) -> list[ApiInventory]:
        stmt = select(ApiInventory).where(ApiInventory.category == category).order_by(ApiInventory.endpoint.asc())
        return list(self.db.scalars(stmt))

    def list_all(self) -> list[ApiInventory]:
        stmt = select(ApiInventory).order_by(ApiInventory.endpoint.asc())
        return list(self.db.scalars(stmt))

    def get_by_endpoint(self, endpoint: str, category: str | None = None) -> ApiInventory | None:
        stmt = select(ApiInventory).where(ApiInventory.endpoint == endpoint)
        if category:
            stmt = stmt.where(ApiInventory.category == category)
        return self.db.scalar(stmt)


class RequestLogRepository:
    """Database operations for request logs."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, log_entry: RequestLog) -> RequestLog:
        self.db.add(log_entry)
        self.db.flush()
        return log_entry

    def list_recent(self, limit: int = 100) -> list[RequestLog]:
        stmt = select(RequestLog).order_by(RequestLog.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def count_requests(self, *, user_id: int | None = None, ip_address: str | None = None, since: datetime | None = None) -> int:
        stmt = select(func.count(RequestLog.id))
        if user_id is not None:
            stmt = stmt.where(RequestLog.user_id == user_id)
        if ip_address is not None:
            stmt = stmt.where(RequestLog.ip_address == ip_address)
        if since is not None:
            stmt = stmt.where(RequestLog.timestamp >= since)
        return int(self.db.scalar(stmt) or 0)

    def delete_all(self) -> int:
        result = self.db.execute(delete(RequestLog))
        return int(result.rowcount or 0)