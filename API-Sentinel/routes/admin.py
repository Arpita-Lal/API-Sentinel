"""Admin-only routes for platform operations and telemetry review."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user, require_roles
from backend.models import Alert, ApiInventory, RequestLog
from backend.schemas import AlertRead, InventoryRead, RequestLogRead
from backend.services import AuthenticatedUser

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/alerts", response_model=list[AlertRead], dependencies=[Depends(require_roles("admin", "security_analyst"))])
def list_alerts(db: Session = Depends(get_db)):
    """List recent alerts for the security team."""

    return [AlertRead.model_validate(alert) for alert in db.scalars(select(Alert).order_by(Alert.timestamp.desc()).limit(200))]


@router.get("/inventory", response_model=list[InventoryRead], dependencies=[Depends(require_roles("admin", "security_analyst", "developer"))])
def list_inventory(db: Session = Depends(get_db)):
    """Return the current API inventory state."""

    return [InventoryRead.model_validate(item) for item in db.scalars(select(ApiInventory).order_by(ApiInventory.endpoint.asc()))]


@router.get("/logs", response_model=list[RequestLogRead], dependencies=[Depends(require_roles("admin"))])
def list_logs(db: Session = Depends(get_db)):
    """Return request telemetry for admins."""

    return [RequestLogRead.model_validate(entry) for entry in db.scalars(select(RequestLog).order_by(RequestLog.timestamp.desc()).limit(500))]


@router.delete("/logs", dependencies=[Depends(require_roles("admin"))])
def delete_logs(db: Session = Depends(get_db)):
    """Delete all request logs. Admin-only operation."""

    deleted = db.execute(delete(RequestLog))
    db.commit()
    return {"deleted": int(deleted.rowcount or 0)}