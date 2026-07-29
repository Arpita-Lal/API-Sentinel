"""Authentication routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.dependencies import get_auth_service
from backend.schemas import LoginRequest, TokenResponse, UserRead
from backend.services import AuthService

router = APIRouter(tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    """Authenticate a user and return a JWT access token."""

    user, token = auth_service.login(username=payload.username, password=payload.password)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))