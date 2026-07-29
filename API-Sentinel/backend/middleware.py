"""HTTP middleware for request logging, API inventory observation, and lightweight threat checks."""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from fastapi import Request, Response
from starlette.concurrency import iterate_in_threadpool
from starlette.middleware.base import BaseHTTPMiddleware

from backend.auth import decode_access_token
from backend.config import get_settings
from backend.database import SessionLocal
from backend.logger import setup_logger
from backend.models import RequestLog
from backend.repositories import AlertRepository, InventoryRepository, RequestLogRepository, UserRepository
from backend.services import AlertService, AuthenticatedUser, InventoryService, RequestLogService
from modules.anomaly_detector import classify_risk_level
from modules.api_inventory import DEPRECATED_ENDPOINTS, KNOWN_ENDPOINTS, normalize_endpoint
from modules.alert_engine import emit_alert
from modules.behavior_detector import analyze_behavior
from modules.rate_limiter import rate_limiter
from modules.shadow_detector import detect_shadow_api
from modules.zombie_detector import detect_zombie_api

log = setup_logger("api-sentinel.middleware")


@dataclass(frozen=True)
class RequestContext:
    """Telemetry snapshot derived from an incoming HTTP request."""

    request_id: str
    ip_address: str | None
    user_id: int | None
    username: str | None
    role: str | None
    endpoint: str
    method: str
    user_agent: str | None
    headers: dict[str, str]


def _best_effort_user_context(request: Request) -> tuple[int | None, str | None, str | None]:
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.lower().startswith("bearer "):
        return None, None, None

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception:  # noqa: BLE001 - telemetry enrichment only
        return None, None, None

    try:
        user_id = None
        with SessionLocal() as db:
            user = UserRepository(db).get_by_public_id(payload["sub"])
            if user is not None:
                user_id = user.id
        return user_id, payload.get("username"), payload.get("role")
    except Exception:  # noqa: BLE001 - telemetry enrichment only
        return None, None, None


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Capture request telemetry, store it in SQLite, and feed detectors."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex)
        start_time = time.perf_counter()
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        user_id, username, role = _best_effort_user_context(request)

        request.state.request_id = request_id
        request.state.user_id = user_id
        request.state.username = username
        request.state.role = role

        settings = get_settings()
        if not rate_limiter.allow(key=ip_address or "anonymous", window_seconds=settings.rate_limit_window_seconds, max_requests=settings.rate_limit_max_requests):
            with SessionLocal() as db:
                AlertService(AlertRepository(db)).raise_alert(
                    severity="WARNING",
                    detector="RateLimiter",
                    description="Rate limit exceeded by client",
                    risk_score=70,
                    evidence={"ip_address": ip_address, "request_id": request_id},
                    recommendation="Throttle the client, inspect for scanning or automation patterns.",
                    user_id=user_id,
                    username=username,
                    ip_address=ip_address,
                    endpoint=request.url.path,
                )
            return Response(content=json.dumps({"detail": "Too Many Requests"}), status_code=429, media_type="application/json")

        response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

        body_chunks = []
        async for chunk in response.body_iterator:
            body_chunks.append(chunk)
        body = b"".join(body_chunks)

        response_headers = dict(response.headers)
        response_headers["X-Request-ID"] = request_id
        rebuilt_response = Response(
            content=body,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.media_type,
        )
        rebuilt_response.background = response.background

        route = request.scope.get("route")
        endpoint = getattr(route, "path", None) or normalize_endpoint(request.url.path)

        with SessionLocal() as db:
            request_log = RequestLog(
                request_id=request_id,
                timestamp=datetime.now(timezone.utc),
                user_id=user_id,
                username=username,
                ip_address=ip_address,
                endpoint=endpoint,
                method=request.method,
                status_code=rebuilt_response.status_code,
                response_time_ms=elapsed_ms,
                request_headers={key: value for key, value in request.headers.items()},
                user_agent=user_agent,
                response_size_bytes=len(body),
            )
            RequestLogService(RequestLogRepository(db)).create_log(request_log)

            inventory_service = InventoryService(InventoryRepository(db))
            if endpoint in KNOWN_ENDPOINTS:
                inventory_service.record_hit(endpoint, category="known", status="known", notes="Observed platform endpoint")
            elif endpoint in DEPRECATED_ENDPOINTS:
                inventory_service.record_hit(endpoint, category="deprecated", status="deprecated", notes="Deprecated endpoint observed")
            else:
                inventory_service.record_hit(endpoint, category="discovered", status="discovered", risk_score=75, notes="Undocumented endpoint observed")

            detect_shadow_api(
                db=db,
                endpoint=endpoint,
                method=request.method,
                status_code=rebuilt_response.status_code,
                user_id=user_id,
                username=username,
                ip_address=ip_address,
                request_id=request_id,
            )
            detect_zombie_api(
                db=db,
                endpoint=endpoint,
                method=request.method,
                status_code=rebuilt_response.status_code,
                user_id=user_id,
                username=username,
                ip_address=ip_address,
                request_id=request_id,
            )
            analyze_behavior(
                db=db,
                user_id=user_id,
                username=username,
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint=endpoint,
                method=request.method,
                status_code=rebuilt_response.status_code,
                response_time_ms=elapsed_ms,
                request_id=request_id,
            )

            db.commit()

            log.info(
                "request_id=%s method=%s endpoint=%s status=%s duration_ms=%s user=%s ip=%s",
                request_id,
                request.method,
                endpoint,
                rebuilt_response.status_code,
                elapsed_ms,
                username or "anonymous",
                ip_address or "unknown",
            )

        return rebuilt_response