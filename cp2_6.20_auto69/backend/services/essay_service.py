from typing import List, Optional
from datetime import datetime
import uuid
from pathlib import Path
from backend.repositories import json_repository
from backend.models.schemas import Essay, EssayCreate


ESSAYS_FILE = "essays.json"
UPLOAD_DIR = Path(__file__).parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_essays_by_class(class_id: str) -> List[dict]:
    return json_repository.filter_by(ESSAYS_FILE, classId=class_id)


def get_essay_by_id(essay_id: str) -> Optional[dict]:
    essay = json_repository.get_by_id(ESSAYS_FILE, essay_id)
    if essay and "content" in essay:
        paragraphs = [p.strip() for p in essay["content"].split("\n\n") if p.strip()]
        essay = dict(essay)
        essay["paragraphs"] = paragraphs
    return essay


def create_essay(data: EssayCreate) -> dict:
    new_essay = {
        "id": f"essay-{uuid.uuid4().hex[:8]}",
        "classId": data.classId,
        "studentName": data.studentName,
        "title": data.title,
        "content": data.content,
        "uploadTime": datetime.utcnow().isoformat(),
    }
    return json_repository.create(ESSAYS_FILE, new_essay)


async def save_uploaded_file(filename: str, content: bytes) -> str:
    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
    file_path.write_bytes(content)
    return str(file_path)
