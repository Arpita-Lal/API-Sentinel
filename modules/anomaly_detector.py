"""Risk level classification helpers used by behavioral analysis and alert routing."""

from __future__ import annotations


def classify_risk_level(score: int) -> str:
    """Map a numeric risk score to a human-readable severity bucket."""

    if score >= 90:
        return "CRITICAL"
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"