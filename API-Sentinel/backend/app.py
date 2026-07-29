"""FastAPI application entry point for API-Sentinel."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_db, init_db, seed_demo_data
from backend.logger import setup_logger
from backend.models import Alert, RequestLog, User
from backend.repositories import AlertRepository, InventoryRepository, RequestLogRepository, UserRepository
from backend.dependencies import require_roles
from backend.middleware import RequestLoggingMiddleware
from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.orders import router as orders_router
from routes.payment import router as payment_router
from routes.profile import router as profile_router

log = setup_logger("api-sentinel.app")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database and seed demo data on startup."""

    init_db()
    seed_demo_data()
    log.info("API-Sentinel backend initialized.")
    yield


def create_app() -> FastAPI:
    """Build the FastAPI application instance."""

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Enterprise API runtime security platform",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)

    app.include_router(auth_router)
    app.include_router(profile_router)
    app.include_router(orders_router)
    app.include_router(payment_router)
    app.include_router(admin_router)

    @app.get("/")
    def root() -> FileResponse:
        dashboard_path = Path(__file__).resolve().parent.parent / "dashboard" / "index.html"
        return FileResponse(dashboard_path)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "healthy"}

    @app.get("/dashboard", include_in_schema=False)
    def dashboard() -> FileResponse:
        dashboard_path = Path(__file__).resolve().parent.parent / "dashboard" / "index.html"
        return FileResponse(dashboard_path)

    @app.get("/api/stats")
    def api_stats(
        db: Session = Depends(get_db),
        current_user=Depends(require_roles("admin", "security_analyst", "developer", "viewer")),
    ) -> dict[str, int]:
        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(hours=1)
        log_repo = RequestLogRepository(db)
        alert_repo = AlertRepository(db)

        request_rows = list(db.scalars(select(RequestLog.user_id).where(RequestLog.timestamp >= one_hour_ago)))
        active_users = len({user_id for user_id in request_rows if user_id is not None})

        return {
            "total_requests": log_repo.count_requests(),
            "total_alerts": alert_repo.count_since(datetime.fromtimestamp(0, tz=timezone.utc)),
            "active_users": active_users,
            "blocked_requests": int(db.scalar(select(func.count(RequestLog.id)).where(RequestLog.status_code >= 400)) or 0),
        }

    @app.get("/api/alerts")
    def api_alerts(
        db: Session = Depends(get_db),
        current_user=Depends(require_roles("admin", "security_analyst")),
    ) -> dict[str, list[dict]]:
        alerts = AlertRepository(db).list_recent(limit=200)
        payload = [
            {
                "id": alert.alert_id,
                "timestamp": alert.timestamp,
                "level": alert.severity,
                "reason": alert.description,
                "user_id": alert.user_id,
                "details": alert.evidence,
                "detector": alert.detector,
                "risk_score": alert.risk_score,
                "recommendation": alert.recommendation,
            }
            for alert in alerts
        ]
        return {"data": payload}

    @app.get("/api/logs")
    def api_logs(
        db: Session = Depends(get_db),
        current_user=Depends(require_roles("admin", "security_analyst", "developer")),
    ) -> dict[str, list[dict]]:
        logs = RequestLogRepository(db).list_recent(limit=250)
        payload = [
            {
                "id": entry.request_id,
                "timestamp": entry.timestamp,
                "method": entry.method,
                "endpoint": entry.endpoint,
                "status_code": entry.status_code,
                "user_id": entry.user_id,
                "username": entry.username,
                "ip_address": entry.ip_address,
                "response_time_ms": entry.response_time_ms,
                "response_size_bytes": entry.response_size_bytes,
            }
            for entry in logs
        ]
        return {"data": payload}

    @app.get("/api/inventory")
    def api_inventory(
        db: Session = Depends(get_db),
        current_user=Depends(require_roles("admin", "security_analyst", "developer", "viewer")),
    ) -> dict[str, list[dict]]:
        inventory = InventoryRepository(db).list_all()
        payload = [
            {
                "endpoint": item.endpoint,
                "status": "Known" if item.category == "known" else ("Old" if item.category == "deprecated" else "Discovered"),
                "category": item.category,
                "risk_score": item.risk_score,
                "hit_count": item.hit_count,
            }
            for item in inventory
        ]
        return {"data": payload}

    init_db()
    seed_demo_data()

    return app


app = create_app()