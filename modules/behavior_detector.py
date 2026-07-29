"""Behavioral analysis and anomaly scoring for API activity."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import RequestLog
from modules.alert_engine import emit_alert
from modules.anomaly_detector import classify_risk_level


def analyze_behavior(
    *,
    db: Session,
    user_id: int | None,
    username: str | None,
    ip_address: str | None,
    user_agent: str | None,
    endpoint: str,
    method: str,
    status_code: int,
    response_time_ms: float,
    request_id: str,
):
    """Score recent behavior and emit alerts when the pattern becomes suspicious."""

    if user_id is None and ip_address is None:
        return None

    since = datetime.now(timezone.utc) - timedelta(minutes=10)
    stmt = select(RequestLog).where(RequestLog.timestamp >= since)
    if user_id is not None:
        stmt = stmt.where(RequestLog.user_id == user_id)
    elif ip_address is not None:
        stmt = stmt.where(RequestLog.ip_address == ip_address)

    recent_logs = list(db.scalars(stmt.order_by(RequestLog.timestamp.desc()).limit(50)))
    if not recent_logs:
        return None

    score = 0
    reasons: list[str] = []

    request_rate = len(recent_logs) / 10.0
    if request_rate > 6:
        score += 35
        reasons.append(f"High request rate detected: {request_rate:.2f} req/min")

    if response_time_ms > 1500:
        score += 10
        reasons.append("Elevated response time")

    distinct_ips = {entry.ip_address for entry in recent_logs if entry.ip_address}
    if len(distinct_ips) > 2:
        score += 20
        reasons.append("Multiple IP addresses used in a short window")

    distinct_user_agents = {entry.user_agent for entry in recent_logs if entry.user_agent}
    if len(distinct_user_agents) > 2:
        score += 15
        reasons.append("User-Agent changed across recent requests")

    status_counts = Counter(entry.status_code for entry in recent_logs)
    if status_counts.get(404, 0) >= 5:
        score += 20
        reasons.append("Repeated 404s indicate enumeration or fuzzing")

    if method.upper() in {"TRACE", "TRACK", "CONNECT"}:
        score += 40
        reasons.append(f"Suspicious method {method.upper()} observed")

    if endpoint.count("/") > 4:
        score += 10
        reasons.append("Deep path traversal pattern observed")

    severity = classify_risk_level(score)
    if severity == "LOW":
        return None

    description = f"Behavioral anomaly score {score} for {'user ' + username if username else 'client'}"
    evidence = {
        "request_id": request_id,
        "endpoint": endpoint,
        "method": method,
        "response_time_ms": response_time_ms,
        "recent_request_count": len(recent_logs),
        "distinct_ips": sorted(distinct_ips),
        "distinct_user_agents": sorted(distinct_user_agents),
        "reasons": reasons,
    }
    return emit_alert(
        db=db,
        severity=severity,
        detector="BehaviorDetector",
        description=description,
        risk_score=score,
        evidence=evidence,
        recommendation="Review the session for automation, credential abuse, or API enumeration patterns.",
        user_id=user_id,
        username=username,
        ip_address=ip_address,
        endpoint=endpoint,
    )