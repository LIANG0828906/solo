import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from database import get_db
from models.work import UploadResponse, FileType
import aiosqlite
from PIL import Image
import io

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
THUMB_DIR = os.path.join(UPLOAD_DIR, "thumbs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)


@router.post("", response_model=UploadResponse)
async def upload_work(
    title: str = Form(...),
    uploader: str = Form(...),
    uploader_email: str = Form(...),
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    work_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    filename = f"{work_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_type = FileType.video if file.content_type and file.content_type.startswith("video/") else FileType.image
    thumbnail_url = None

    if file_type == FileType.image:
        thumb_filename = f"{work_id}.jpg"
        thumb_path = os.path.join(THUMB_DIR, thumb_filename)
        try:
            img = Image.open(io.BytesIO(content))
            img.thumbnail((300, 300))
            img.convert("RGB").save(thumb_path, "JPEG")
            thumbnail_url = f"/uploads/thumbs/{thumb_filename}"
        except Exception:
            pass

    file_url = f"/uploads/{filename}"

    await db.execute(
        "INSERT INTO works (id, title, uploader, uploader_email, file_url, file_type, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (work_id, title, uploader, uploader_email, file_url, file_type.value, thumbnail_url),
    )
    await db.commit()

    return UploadResponse(
        id=work_id,
        file_url=file_url,
        thumbnail_url=thumbnail_url,
        status="pending",
    )
