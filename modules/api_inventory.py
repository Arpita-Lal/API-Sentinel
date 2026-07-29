"""Known and discovered API inventory helpers."""

from __future__ import annotations

from typing import Final

KNOWN_ENDPOINTS: Final[set[str]] = {
    "/login",
    "/profile",
    "/orders",
    "/orders/{order_id}",
    "/payment",
    "/user",
    "/admin/alerts",
    "/admin/inventory",
    "/admin/logs",
    "/api/security/bola-alerts",
    "/api/security/user/{user_id}/access-map",
}

DEPRECATED_ENDPOINTS: Final[set[str]] = {
    "/old_login",
    "/v1/payment",
}


def normalize_endpoint(path: str) -> str:
    """Normalize an endpoint path for inventory comparisons."""

    return path.rstrip("/") or "/"