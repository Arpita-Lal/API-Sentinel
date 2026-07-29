"""FastAPI dependencies for database, authentication, and services."""

from __future__ import annotations

from typing import Annotated, Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.auth import decode_access_token
from backend.database import get_db
from backend.repositories import AlertRepository, InventoryRepository, OrderRepository, PaymentRepository, RequestLogRepository, UserRepository
from backend.services import AlertService, AuthService, AuthenticatedUser, InventoryService, OrderService, PaymentService, RequestLogService, UserService

bearer_scheme = HTTPBearer(auto_error=False)


def get_database_session() -> Session:
    """Database session dependency placeholder for typing helpers."""

    raise RuntimeError("Use Depends(get_db) directly in FastAPI path operations")


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> AuthenticatedUser:
    """Resolve the authenticated user from the request JWT."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")

    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:  # noqa: BLE001 - handled as auth failure
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    user = UserRepository(db).get_by_public_id(payload["sub"])
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or missing")

    authenticated = AuthenticatedUser(id=user.id, public_id=user.public_id, username=user.username, role=user.role)
    request.state.current_user = authenticated
    return authenticated


def require_roles(*allowed_roles: str) -> Callable:
    """Return a dependency that enforces one of the given roles."""

    def dependency(current_user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
        return current_user

    return dependency


def get_auth_service(db: Annotated[Session, Depends(get_db)]) -> AuthService:
    return AuthService(UserRepository(db))


def get_user_service(db: Annotated[Session, Depends(get_db)]) -> UserService:
    return UserService(UserRepository(db))


def get_order_service(db: Annotated[Session, Depends(get_db)]) -> OrderService:
    return OrderService(OrderRepository(db), AlertRepository(db))


def get_payment_service(db: Annotated[Session, Depends(get_db)]) -> PaymentService:
    return PaymentService(OrderRepository(db), PaymentRepository(db))


def get_alert_service(db: Annotated[Session, Depends(get_db)]) -> AlertService:
    return AlertService(AlertRepository(db))


def get_inventory_service(db: Annotated[Session, Depends(get_db)]) -> InventoryService:
    return InventoryService(InventoryRepository(db))


def get_request_log_service(db: Annotated[Session, Depends(get_db)]) -> RequestLogService:
    return RequestLogService(RequestLogRepository(db))