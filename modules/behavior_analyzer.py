"""Behavior learning for normal user-object access patterns."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import RLock
from typing import Any


@dataclass(slots=True)
class UserObjectHistory:
    allowed_objects: set[str]
    frequency: dict[str, int]
    last_seen: datetime | None = None


class BehaviorAnalyzer:
    """Learn normal object access behavior from observed traffic."""

    def __init__(self) -> None:
        self._history: dict[int, UserObjectHistory] = {}
        self._lock = RLock()

    def _get_history(self, user_id: int) -> UserObjectHistory:
        history = self._history.get(user_id)
        if history is None:
            history = UserObjectHistory(allowed_objects=set(), frequency=defaultdict(int))
            self._history[user_id] = history
        return history

    @staticmethod
    def object_key(object_type: str | None, object_id: str | None) -> str:
        return f"{object_type or 'unknown'}:{object_id or 'unknown'}"

    @staticmethod
    def endpoint_key(action: str, endpoint: str) -> str:
        return f"{action.upper()} {endpoint}"

    def record_observation(
        self,
        *,
        user_id: int | None,
        object_type: str | None,
        object_id: str | None,
        endpoint: str,
        action: str,
        authorized: bool,
        timestamp: datetime | None = None,
    ) -> None:
        if user_id is None:
            return

        now = timestamp or datetime.now(timezone.utc)
        with self._lock:
            history = self._get_history(user_id)
            key = self.endpoint_key(action, endpoint)
            history.frequency[key] = int(history.frequency[key]) + 1
            if authorized and object_id is not None:
                history.allowed_objects.add(self.object_key(object_type, object_id))
            history.last_seen = now

    def get_history(self, user_id: int) -> dict[str, Any]:
        with self._lock:
            history = self._history.get(user_id)
            if history is None:
                return {"allowed_objects": [], "frequency": {}, "last_seen": None}

            return {
                "allowed_objects": sorted(history.allowed_objects),
                "frequency": dict(history.frequency),
                "last_seen": history.last_seen,
            }

    def is_new_object(self, *, user_id: int | None, object_type: str | None, object_id: str | None) -> bool:
        if user_id is None or object_id is None:
            return False

        with self._lock:
            history = self._history.get(user_id)
            if history is None:
                return True
            return self.object_key(object_type, object_id) not in history.allowed_objects

    def request_frequency(self, *, user_id: int | None, action: str, endpoint: str) -> int:
        if user_id is None:
            return 0

        with self._lock:
            history = self._history.get(user_id)
            if history is None:
                return 0
            return int(history.frequency.get(self.endpoint_key(action, endpoint), 0))
