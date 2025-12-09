from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from ..config import Settings, get_settings


def require_admin(
    password: str = Header(..., alias="x-admin-password"),
    settings: Settings = Depends(get_settings),
) -> None:
    """Shared dependency that authorizes admin-only routes."""

    if password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin password")

