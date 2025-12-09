from __future__ import annotations

import time
from datetime import date
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel


def timestamp_ms() -> int:
    """Return current timestamp in milliseconds."""

    return int(time.time() * 1000)


class Event(SQLModel, table=True):
    """Persisted event representation."""

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    title: str
    slug: str = Field(index=True, unique=True)
    date: date
    description: Optional[str] = None
    watermark_text: Optional[str] = None
    cover_photo_id: Optional[UUID] = Field(default=None, foreign_key="photo.id")
    created_at: int = Field(default_factory=timestamp_ms, index=True)

class Photo(SQLModel, table=True):
    """Persisted photo representation."""

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    event_id: UUID = Field(foreign_key="event.id", index=True)
    event_slug: str = Field(index=True)
    filename: str
    name: str
    content_type: Optional[str] = None
    caption: Optional[str] = None
    width: int
    height: int
    size: int
    uploaded_at: int = Field(default_factory=timestamp_ms, index=True)
    is_favorite: bool = Field(default=False, index=True)

class EventCreate(BaseModel):
    """Incoming payload to create an event."""

    title: str
    slug: str
    date: date
    description: Optional[str] = None
    watermarkText: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class EventRead(BaseModel):
    """API representation of an event."""

    id: UUID
    title: str
    slug: str
    date: date
    description: Optional[str] = None
    watermarkText: Optional[str] = None
    coverPhotoId: Optional[UUID] = None
    createdAt: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PhotoRead(BaseModel):
    """API representation of a photo record."""

    id: UUID
    eventId: UUID
    eventSlug: str
    filename: str
    name: str
    type: Optional[str] = None
    caption: Optional[str] = None
    width: int
    height: int
    size: int
    uploadedAt: int
    url: str
    isFavorite: bool

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PhotoCaptionUpdate(BaseModel):
    caption: str


class PhotoFavoriteUpdate(BaseModel):
    isFavorite: bool


class EventCoverUpdate(BaseModel):
    photoId: UUID


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    success: bool

