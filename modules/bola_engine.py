"""Enterprise BOLA heuristics engine with graph learning and alerting."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import RLock
from typing import Any

from sqlalchemy.orm import Session

from backend.models import Alert, BolaAlert, BolaObservation
from backend.repositories import AlertRepository, BolaAlertRepository, BolaObservationRepository
from backend.services import AlertService
from modules.access_graph import AccessGraph
from modules.behavior_analyzer import BehaviorAnalyzer
from modules.risk_engine import RiskEngine


@dataclass(slots=True)
class BolaDetectionResult:
    attack: bool
    type: str
    user: int | None
    object: str | None
    object_type: str | None
    endpoint: str
    risk_score: int
    severity: str
    reason: str
    action: str
    tenant_id: str | None
    role: str | None
    owner_id: int | None
    factors: list[str]

    def as_dict(self) -> dict[str, Any]:
        return {
            "attack": self.attack,
            "type": self.type,
            "user": self.user,
            "object": self.object,
            "object_type": self.object_type,
            "endpoint": self.endpoint,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "reason": self.reason,
            "action": self.action,
            "tenant_id": self.tenant_id,
            "role": self.role,
            "owner_id": self.owner_id,
            "factors": list(self.factors),
        }


class BOLAEngine:
    """Stateful learning engine for BOLA access patterns."""

    def __init__(self) -> None:
        self.access_graph = AccessGraph()
        self.behavior = BehaviorAnalyzer()
        self.risk = RiskEngine()
        self._lock = RLock()
        self._primed = False

    @staticmethod
    def _object_key(object_type: str | None, object_id: str | None) -> str | None:
        if object_id is None:
            return None
        return f"{object_type or 'unknown'}:{object_id}"

    def prime_from_database(self, db: Session) -> None:
        with self._lock:
            if self._primed:
                return

            repository = BolaObservationRepository(db)
            for observation in repository.list_recent(limit=5000):
                self._apply_observation(
                    user_id=observation.user_id,
                    role=observation.role,
                    tenant_id=observation.tenant_id,
                    object_type=observation.object_type,
                    object_id=observation.object_id,
                    endpoint=observation.endpoint,
                    action=observation.action,
                    owner_id=observation.owner_id,
                    authorized=observation.is_authorized,
                    timestamp=observation.timestamp,
                )

            self._primed = True

    def _apply_observation(
        self,
        *,
        user_id: int | None,
        role: str | None,
        tenant_id: str | None,
        object_type: str | None,
        object_id: str | None,
        endpoint: str,
        action: str,
        owner_id: int | None,
        authorized: bool,
        timestamp: datetime | None = None,
    ) -> None:
        self.behavior.record_observation(
            user_id=user_id,
            object_type=object_type,
            object_id=object_id,
            endpoint=endpoint,
            action=action,
            authorized=authorized,
            timestamp=timestamp,
        )
        self.access_graph.record_access(
            user_id=user_id,
            object_type=object_type,
            object_id=object_id,
            endpoint=endpoint,
            action=action,
            role=role,
            tenant_id=tenant_id,
            owner_id=owner_id,
            authorized=authorized,
            timestamp=timestamp,
        )

    def detect_bola_attack(
        self,
        *,
        user_id: int | None,
        object_id: str | None,
        object_type: str | None,
        endpoint: str,
        action: str = "GET",
        role: str | None = None,
        tenant_id: str | None = None,
        owner_id: int | None = None,
        authorized: bool = False,
    ) -> dict[str, Any]:
        with self._lock:
            is_new_object = self.behavior.is_new_object(user_id=user_id, object_type=object_type, object_id=object_id)
            request_frequency = self.behavior.request_frequency(user_id=user_id, action=action, endpoint=endpoint)
            assessment = self.risk.assess(
                user_id=user_id,
                object_id=object_id,
                object_type=object_type,
                endpoint=endpoint,
                owner_id=owner_id,
                is_new_object=is_new_object,
                request_frequency=request_frequency,
                authorized=authorized,
            )

            return BolaDetectionResult(
                attack=assessment.attack,
                type="BOLA",
                user=user_id,
                object=object_id,
                object_type=object_type,
                endpoint=endpoint,
                risk_score=assessment.risk_score,
                severity=assessment.severity,
                reason=assessment.reason or "User attempted access to unauthorized object",
                action=action,
                tenant_id=tenant_id,
                role=role,
                owner_id=owner_id,
                factors=assessment.factors,
            ).as_dict()

    def observe_request(
        self,
        *,
        db: Session,
        request_id: str,
        user_id: int | None,
        role: str | None,
        tenant_id: str | None,
        object_type: str | None,
        object_id: str | None,
        endpoint: str,
        action: str,
        owner_id: int | None,
        status_code: int,
        username: str | None = None,
        ip_address: str | None = None,
    ) -> dict[str, Any]:
        with self._lock:
            if not self._primed:
                self.prime_from_database(db)

            authorized = status_code < 400 and (owner_id is None or user_id is None or owner_id == user_id)
            detection = self.detect_bola_attack(
                user_id=user_id,
                object_id=object_id,
                object_type=object_type,
                endpoint=endpoint,
                action=action,
                role=role,
                tenant_id=tenant_id,
                owner_id=owner_id,
                authorized=authorized,
            )

            observation = BolaObservation(
                timestamp=datetime.now(timezone.utc),
                user_id=user_id,
                role=role,
                tenant_id=tenant_id,
                object_type=object_type,
                object_id=object_id,
                endpoint=endpoint,
                action=action,
                owner_id=owner_id,
                status_code=status_code,
                is_authorized=authorized,
                request_id=request_id,
            )
            BolaObservationRepository(db).create(observation)

            self._apply_observation(
                user_id=user_id,
                role=role,
                tenant_id=tenant_id,
                object_type=object_type,
                object_id=object_id,
                endpoint=endpoint,
                action=action,
                owner_id=owner_id,
                authorized=authorized,
                timestamp=observation.timestamp,
            )

            if detection["attack"]:
                alert = BolaAlert(
                    user_id=user_id,
                    object_type=object_type,
                    object_id=object_id or "unknown",
                    endpoint=endpoint,
                    action=action,
                    risk_score=int(detection["risk_score"]),
                    severity=str(detection["severity"]),
                    reason=str(detection["reason"]),
                    tenant_id=tenant_id,
                    role=role,
                    owner_id=owner_id,
                    details={
                        "request_id": request_id,
                        "username": username,
                        "ip_address": ip_address,
                        "object_key": self._object_key(object_type, object_id),
                        "factors": detection.get("factors", []),
                    },
                )
                BolaAlertRepository(db).create(alert)

                AlertService(AlertRepository(db)).raise_alert(
                    severity=str(detection["severity"]).upper(),
                    detector="BOLAEngine",
                    description="User attempted access to unauthorized object",
                    risk_score=int(detection["risk_score"]),
                    evidence={
                        "request_id": request_id,
                        "object_id": object_id,
                        "object_type": object_type,
                        "endpoint": endpoint,
                        "owner_id": owner_id,
                        "factors": detection.get("factors", []),
                    },
                    recommendation="Verify object ownership before object-level access and enforce policy checks at the gateway.",
                    user_id=user_id,
                    username=username,
                    ip_address=ip_address,
                    endpoint=endpoint,
                )

            return detection

    def get_access_map(self, user_id: int) -> dict[str, Any]:
        with self._lock:
            return {
                "user_id": user_id,
                "history": self.behavior.get_history(user_id),
                "graph": self.access_graph.get_user_map(user_id),
            }


_ENGINE: BOLAEngine | None = None
_ENGINE_LOCK = RLock()


def get_bola_engine(db: Session | None = None) -> BOLAEngine:
    global _ENGINE
    with _ENGINE_LOCK:
        if _ENGINE is None:
            _ENGINE = BOLAEngine()
        if db is not None and not _ENGINE._primed:
            _ENGINE.prime_from_database(db)
        return _ENGINE


def detect_bola_attack(
    user_id: int | None,
    object_id: str | None,
    object_type: str | None,
    endpoint: str,
    *,
    action: str = "GET",
    role: str | None = None,
    tenant_id: str | None = None,
    owner_id: int | None = None,
    authorized: bool = False,
) -> dict[str, Any]:
    return get_bola_engine().detect_bola_attack(
        user_id=user_id,
        object_id=object_id,
        object_type=object_type,
        endpoint=endpoint,
        action=action,
        role=role,
        tenant_id=tenant_id,
        owner_id=owner_id,
        authorized=authorized,
    )
