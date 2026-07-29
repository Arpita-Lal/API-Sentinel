"""Profile and account management routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status

from backend.dependencies import get_current_user, get_user_service
from backend.schemas import UserRead
from backend.services import AuthenticatedUser, UserService

router = APIRouter(tags=["Profile"])


@router.get("/profile", response_model=UserRead)
def get_profile(current_user: AuthenticatedUser = Depends(get_current_user), user_service: UserService = Depends(get_user_service)):
    """Return the authenticated user's profile."""

    return UserRead.model_validate(user_service.get_profile(current_user))


@router.delete("/user", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(current_user: AuthenticatedUser = Depends(get_current_user), user_service: UserService = Depends(get_user_service)):
    """Delete the authenticated user's account."""

    user_service.delete_account(current_user)