from __future__ import annotations

import logging
import mimetypes
import tempfile
import zipfile
from pathlib import Path
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

try:
    from pillow_heif import register_heif_opener
except ModuleNotFoundError:
    register_heif_opener = None
    logger.warning("pillow-heif is not installed; HEIC uploads will fail to process.")
else:
    register_heif_opener()

# Allow very large images to be processed without Pillow raising DecompressionBombError.
Image.MAX_IMAGE_PIXELS = None

from sqlmodel import Session

from .. import crud
from ..config import Settings, get_settings
from ..database import get_session
from ..models import EventCoverUpdate, EventCreate, EventRead, PhotoRead
from .dependencies import require_admin

CHUNK_SIZE = 4 * 1024 * 1024  # 4MB streaming chunks

router = APIRouter(prefix="/events", tags=["events"])


def _event_directory(settings: Settings, slug: str) -> Path:
    return Path(settings.uploads_dir) / slug


async def _stream_upload_to_disk(upload: UploadFile, destination: Path) -> int:
    """Write the incoming UploadFile to disk in chunks and return the total bytes written."""
    size = 0
    with destination.open("wb") as buffer:
        while True:
            chunk = await upload.read(CHUNK_SIZE)
            if not chunk:
                break
            size += len(chunk)
            buffer.write(chunk)
    await upload.close()
    return size


@router.get("", response_model=List[EventRead])
def list_events(session: Session = Depends(get_session)) -> List[EventRead]:
    return crud.list_events(session)


@router.get("/{slug}", response_model=EventRead)
def get_event(slug: str, session: Session = Depends(get_session)) -> EventRead:
    event = crud.get_event_or_404(session, slug=slug)
    return crud.serialize_event(event)


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_event(
    payload: EventCreate,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> EventRead:
    return crud.create_event(session, payload, settings)


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_event(
    event_id: UUID,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Response:
    crud.delete_event(session, event_id, settings)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{event_id}/cover",
    response_model=EventRead,
    dependencies=[Depends(require_admin)],
)
def update_event_cover(
    event_id: UUID,
    payload: EventCoverUpdate,
    session: Session = Depends(get_session),
) -> EventRead:
    return crud.set_event_cover(session, event_id, payload.photoId)


@router.get("/{slug}/photos", response_model=List[PhotoRead])
def list_event_photos(slug: str, session: Session = Depends(get_session)) -> List[PhotoRead]:
    event = crud.get_event_or_404(session, slug=slug)
    return crud.list_photos_for_event(session, event=event)


@router.post(
    "/{event_id}/photos",
    response_model=List[PhotoRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def upload_event_photos(
    event_id: UUID,
    files: List[UploadFile] = File(...),
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> List[PhotoRead]:
    event = crud.get_event_or_404(session, event_id=event_id)
    event_dir = _event_directory(settings, event.slug)
    event_dir.mkdir(parents=True, exist_ok=True)

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded")

    created: List[PhotoRead] = []
    for upload in files:
        extension = Path(upload.filename or "").suffix.lower()
        if not extension:
            guessed = mimetypes.guess_extension(upload.content_type or "") or ".jpg"
            extension = guessed
        filename = f"{uuid4().hex}{extension}"
        file_path = event_dir / filename
        size = await _stream_upload_to_disk(upload, file_path)
        if size == 0:
            file_path.unlink(missing_ok=True)
            continue

        try:
            with Image.open(file_path) as image:
                width, height = image.size
        except UnidentifiedImageError as exc:
            file_path.unlink(missing_ok=True)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file") from exc

        created.append(
            crud.register_photo(
                session,
                event=event,
                filename=filename,
                original_name=upload.filename or filename,
                content_type=upload.content_type,
                width=width,
                height=height,
                size=size,
            )
        )

    if not created:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid images were uploaded")
    return created


def _zip_directory(path: Path):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        archive_path = Path(tmp.name)

    with zipfile.ZipFile(archive_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in path.rglob("*"):
            if file_path.is_file():
                zip_file.write(file_path, arcname=file_path.relative_to(path))

    try:
        with archive_path.open("rb") as archive:
            while chunk := archive.read(1024 * 1024):
                yield chunk
    finally:
        archive_path.unlink(missing_ok=True)


@router.get("/{slug}/zip")
def download_event_zip(
    slug: str,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
):
    event = crud.get_event_or_404(session, slug=slug)
    folder = _event_directory(settings, event.slug)
    if not folder.exists() or not any(folder.iterdir()):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No photos available for download")

    filename = f"{event.slug}.zip"
    generator = _zip_directory(folder)
    return StreamingResponse(
        generator,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{slug}/download")
def download_event_alias(
    slug: str,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
):
    return download_event_zip(slug, session, settings)

