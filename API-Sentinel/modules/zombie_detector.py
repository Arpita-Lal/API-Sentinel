"""Zombie API detection for deprecated endpoints that still receive traffic."""

from __future__ import annotations

from sqlalchemy.orm import Session

from modules.alert_engine import emit_alert
from modules.api_inventory import DEPRECATED_ENDPOINTS, normalize_endpoint


def detect_zombie_api(
    *,
    db: Session,
    endpoint: str,
    method: str,
    status_code: int,
    user_id: int | None,
    username: str | None,
    ip_address: str | None,
    request_id: str,
):
    """Create an alert when a deprecated endpoint is exercised."""

    normalized = normalize_endpoint(endpoint)
    if normalized not in DEPRECATED_ENDPOINTS:
        return None

    evidence = {"endpoint": normalized, "method": method, "status_code": status_code, "request_id": request_id}
    return emit_alert(
        db=db,
        severity="HIGH",
        detector="ZombieDetector",
        description=f"Deprecated endpoint received traffic: {normalized}",
        risk_score=80,
        evidence=evidence,
        recommendation="Remove the deprecated endpoint or block it at the gateway.",
        user_id=user_id,
        username=username,
        ip_address=ip_address,
        endpoint=normalized,
    )