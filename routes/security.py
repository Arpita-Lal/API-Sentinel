"""Security telemetry endpoints for BOLA alerts and access maps."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user, require_roles
from backend.repositories import BolaAlertRepository
from backend.schemas import BolaAccessMapRead, BolaAlertRead
from backend.services import AuthenticatedUser
from modules.bola_engine import get_bola_engine

router = APIRouter(prefix="/api/security", tags=["Security"])


@router.get("/bola-alerts", response_model=dict[str, list[BolaAlertRead]], dependencies=[Depends(require_roles("admin", "security_analyst"))])
def list_bola_alerts(db: Session = Depends(get_db)) -> dict[str, list[BolaAlertRead]]:
    """Return the most recent BOLA alerts."""

    alerts = BolaAlertRepository(db).list_recent(limit=200)
    return {"data": [BolaAlertRead.model_validate(alert) for alert in alerts]}


@router.get("/user/{user_id}/access-map", response_model=dict[str, BolaAccessMapRead])
def user_access_map(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, BolaAccessMapRead]:
    """Return a learned user-to-object graph for the requested user."""

    if current_user.role not in {"admin", "security_analyst"} and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")

    access_map = get_bola_engine(db).get_access_map(user_id)
    return {"data": BolaAccessMapRead.model_validate(access_map)}
