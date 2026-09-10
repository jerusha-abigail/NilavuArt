"""Durable Cloudinary image storage with a local-development fallback."""
from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from pathlib import Path

import cloudinary
import cloudinary.uploader


@dataclass(frozen=True)
class StoredImage:
    filename: str
    url: str | None
    public_id: str | None


def cloud_storage_configured() -> bool:
    return all(
        os.getenv(name)
        for name in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
    )


def _configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )


def save_image(
    image_bytes: bytes,
    extension: str,
    upload_dir: str,
) -> StoredImage:
    if cloud_storage_configured():
        _configure_cloudinary()
        result = cloudinary.uploader.upload(
            image_bytes,
            folder="nilavuart/artworks",
            resource_type="image",
            overwrite=False,
        )
        return StoredImage(
            filename="",
            url=result["secure_url"],
            public_id=result["public_id"],
        )

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = Path(upload_dir) / filename
    destination.write_bytes(image_bytes)
    return StoredImage(filename=filename, url=None, public_id=None)


def delete_image(
    filename: str,
    public_id: str | None,
    upload_dir: str,
) -> None:
    if public_id and cloud_storage_configured():
        _configure_cloudinary()
        cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
        return

    image_path = Path(upload_dir) / filename
    if image_path.is_file():
        image_path.unlink()
