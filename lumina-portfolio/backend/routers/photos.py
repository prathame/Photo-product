from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session

from .. import crud
from ..config import Settings, get_settings
from ..database import get_session
from ..models import PhotoCaptionUpdate, PhotoFavoriteUpdate, PhotoRead
from .dependencies import require_admin

router = APIRouter(prefix="/photos", tags=["photos"])


@router.get("", response_model=List[PhotoRead])
def list_photos(session: Session = Depends(get_session)) -> List[PhotoRead]:
    return crud.list_all_photos(session)


@router.patch(
    "/{photo_id}",
    response_model=PhotoRead,
    dependencies=[Depends(require_admin)],
)
def update_photo(
    photo_id: UUID,
    payload: PhotoCaptionUpdate,
    session: Session = Depends(get_session),
) -> PhotoRead:
    return crud.update_photo_caption(session, photo_id, payload.caption)


@router.patch(
    "/{photo_id}/favorite",
    response_model=PhotoRead,
)
def update_photo_favorite(
    photo_id: UUID,
    payload: PhotoFavoriteUpdate,
    session: Session = Depends(get_session),
) -> PhotoRead:
    return crud.update_photo_favorite(session, photo_id, payload.isFavorite)


@router.delete(
    "/{photo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def remove_photo(
    photo_id: UUID,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Response:
    crud.delete_photo(session, settings, photo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

