"""Shadow API detection for undocumented endpoints observed in traffic."""

from __future__ import annotations

from sqlalchemy.orm import Session

from modules.alert_engine import emit_alert
from modules.api_inventory import KNOWN_ENDPOINTS, normalize_endpoint


def detect_shadow_api(
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
    """Create an alert if traffic hits an endpoint that is not part of the known API set."""

    normalized = normalize_endpoint(endpoint)
    if normalized in KNOWN_ENDPOINTS:
        return None

    risk_score = 95 if status_code != 404 else 70
    description = f"Undocumented endpoint observed: {normalized}"
    evidence = {"endpoint": normalized, "method": method, "status_code": status_code, "request_id": request_id}
    return emit_alert(
        db=db,
        severity="HIGH" if risk_score >= 80 else "WARNING",
        detector="ShadowDetector",
        description=description,
        risk_score=risk_score,
        evidence=evidence,
        recommendation="Review the endpoint for documentation gaps, access control, and data exposure.",
        user_id=user_id,
        username=username,
        ip_address=ip_address,
        endpoint=normalized,
    )