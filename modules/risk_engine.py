"""Rule-based BOLA risk scoring."""

from __future__ import annotations

from dataclasses import dataclass


SENSITIVE_OBJECT_TYPES = {"order", "payment", "user", "profile", "credential", "session", "admin"}


@dataclass(slots=True)
class RiskAssessment:
    attack: bool
    risk_score: int
    severity: str
    reason: str
    factors: list[str]


class RiskEngine:
    """Combine ownership, novelty, sensitivity, and frequency into a score."""

    def is_sensitive(self, *, object_type: str | None, endpoint: str) -> bool:
        normalized_type = (object_type or "").lower()
        normalized_endpoint = endpoint.lower()
        return normalized_type in SENSITIVE_OBJECT_TYPES or any(token in normalized_endpoint for token in ("/payment", "/payments", "/admin", "/profile", "/user"))

    def assess(
        self,
        *,
        user_id: int | None,
        object_id: str | None,
        object_type: str | None,
        endpoint: str,
        owner_id: int | None,
        is_new_object: bool,
        request_frequency: int,
        authorized: bool,
    ) -> RiskAssessment:
        score = 0
        factors: list[str] = []

        owner_mismatch = user_id is not None and owner_id is not None and owner_id != user_id
        if owner_mismatch:
            score += 50
            factors.append("Unauthorized owner mismatch")

        if is_new_object:
            score += 20
            factors.append("New object never accessed before")

        if self.is_sensitive(object_type=object_type, endpoint=endpoint):
            score += 20
            factors.append("Sensitive object")

        if request_frequency >= 10:
            score += 10
            factors.append("High request frequency")

        if not authorized and not factors:
            factors.append("Unauthorized request blocked by policy")

        score = min(score, 100)
        if score <= 30:
            severity = "Low"
        elif score <= 70:
            severity = "Medium"
        else:
            severity = "Critical"

        attack = owner_mismatch or score >= 71
        reason = "; ".join(factors) if factors else "No material BOLA indicators detected"

        return RiskAssessment(attack=attack, risk_score=score, severity=severity, reason=reason, factors=factors)
