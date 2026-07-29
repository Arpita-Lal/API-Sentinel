"""Centralized alert generation for all detectors."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from backend.repositories import AlertRepository
from backend.services import AlertService


def emit_alert(
    *,
    db: Session,
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
):
    """Persist a security alert and return the stored record."""

    return AlertService(AlertRepository(db)).raise_alert(
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