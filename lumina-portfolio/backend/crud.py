from __future__ import annotations

import shutil
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from .config import Settings
from .models import Event, EventCreate, EventRead, Photo, PhotoRead


def _event_upload_dir(settings: Settings, slug: str, *, ensure: bool = False) -> Path:
    uploads_root = Path(settings.uploads_dir)
    if ensure:
        uploads_root.mkdir(parents=True, exist_ok=True)
    event_dir = uploads_root / slug
    if ensure:
        event_dir.mkdir(parents=True, exist_ok=True)
    return event_dir


def _photo_url(photo: Photo) -> str:
    return f"/static/{photo.event_slug}/{photo.filename}"


def _serialize_photo(photo: Photo) -> PhotoRead:
    return PhotoRead(
        id=photo.id,
        eventId=photo.event_id,
        eventSlug=photo.event_slug,
        filename=photo.filename,
        name=photo.name,
        type=photo.content_type,
        caption=photo.caption,
        width=photo.width,
        height=photo.height,
        size=photo.size,
        uploadedAt=photo.uploaded_at,
        url=_photo_url(photo),
        isFavorite=photo.is_favorite,
    )


def serialize_event(event: Event) -> EventRead:
    return EventRead(
        id=event.id,
        title=event.title,
        slug=event.slug,
        date=event.date,
        description=event.description,
        watermarkText=event.watermark_text,
        coverPhotoId=event.cover_photo_id,
        createdAt=event.created_at,
    )

def list_events(session: Session) -> List[EventRead]:
    events = session.exec(select(Event).order_by(Event.date.desc())).all()
    return [serialize_event(event) for event in events]


def get_event_or_404(session: Session, *, event_id: UUID | None = None, slug: str | None = None) -> Event:
    if event_id:
        event = session.get(Event, event_id)
    elif slug:
        event = session.exec(select(Event).where(Event.slug == slug)).first()
    else:
        event = None

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


def create_event(session: Session, payload: EventCreate, settings: Settings) -> EventRead:
    existing = session.exec(select(Event).where(Event.slug == payload.slug)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

    event = Event(
        title=payload.title,
        slug=payload.slug,
        date=payload.date,
        description=payload.description,
        watermark_text=payload.watermarkText,
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    _event_upload_dir(settings, event.slug, ensure=True)

    return serialize_event(event)


def delete_event(session: Session, event_id: UUID, settings: Settings) -> None:
    event = get_event_or_404(session, event_id=event_id)
    photos = session.exec(select(Photo).where(Photo.event_id == event.id)).all()
    uploads_dir = _event_upload_dir(settings, event.slug)

    for photo in photos:
        photo_path = uploads_dir / photo.filename
        if photo_path.exists():
            photo_path.unlink()
        session.delete(photo)

    session.delete(event)
    session.commit()
    shutil.rmtree(uploads_dir, ignore_errors=True)


def set_event_cover(session: Session, event_id: UUID, photo_id: UUID) -> EventRead:
    event = get_event_or_404(session, event_id=event_id)
    photo = session.get(Photo, photo_id)
    if not photo or photo.event_id != event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo does not belong to this event")
    event.cover_photo_id = photo_id
    session.add(event)
    session.commit()
    session.refresh(event)
    return serialize_event(event)


def register_photo(
    session: Session,
    *,
    event: Event,
    filename: str,
    original_name: str,
    content_type: str | None,
    width: int,
    height: int,
    size: int,
) -> PhotoRead:
    photo = Photo(
        event_id=event.id,
        event_slug=event.slug,
        filename=filename,
        name=original_name,
        content_type=content_type,
        width=width,
        height=height,
        size=size,
    )
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return _serialize_photo(photo)


def list_photos_for_event(session: Session, *, event: Event) -> List[PhotoRead]:
    photos = session.exec(select(Photo).where(Photo.event_id == event.id).order_by(Photo.uploaded_at)).all()
    return [_serialize_photo(photo) for photo in photos]


def list_all_photos(session: Session) -> List[PhotoRead]:
    photos = session.exec(select(Photo).order_by(Photo.uploaded_at)).all()
    return [_serialize_photo(photo) for photo in photos]


def update_photo_caption(session: Session, photo_id: UUID, caption: str) -> PhotoRead:
    photo = session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    photo.caption = caption
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return _serialize_photo(photo)


def update_photo_favorite(session: Session, photo_id: UUID, is_favorite: bool) -> PhotoRead:
    photo = session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    photo.is_favorite = is_favorite
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return _serialize_photo(photo)


def delete_photo(session: Session, settings: Settings, photo_id: UUID) -> None:
    photo = session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    uploads_dir = _event_upload_dir(settings, photo.event_slug)
    file_path = uploads_dir / photo.filename
    if file_path.exists():
        file_path.unlink()
    event = session.get(Event, photo.event_id)
    if event and event.cover_photo_id == photo_id:
        event.cover_photo_id = None
        session.add(event)
    session.delete(photo)
    session.commit()

