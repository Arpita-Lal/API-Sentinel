"""In-memory sliding-window rate limiter with a future Redis-friendly interface."""

from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import time


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window limiter suitable for local development."""

    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, *, key: str, window_seconds: int, max_requests: int) -> bool:
        """Return True if the caller is allowed to proceed."""

        now = time()
        with self._lock:
            event_queue = self._events[key]
            while event_queue and now - event_queue[0] > window_seconds:
                event_queue.popleft()
            if len(event_queue) >= max_requests:
                return False
            event_queue.append(now)
            return True


rate_limiter = SlidingWindowRateLimiter()