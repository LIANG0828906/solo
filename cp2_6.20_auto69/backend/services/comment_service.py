from typing import List, Optional
from datetime import datetime
import uuid
from backend.repositories import json_repository
from backend.models.schemas import CommentCreate, PresetCommentCreate


COMMENTS_FILE = "comments.json"
PRESET_FILE = "preset_comments.json"


def get_comments_by_essay(essay_id: str) -> List[dict]:
    return json_repository.filter_by(COMMENTS_FILE, essayId=essay_id)


def get_comment_by_id(comment_id: str) -> Optional[dict]:
    return json_repository.get_by_id(COMMENTS_FILE, comment_id)


def create_comment(data: CommentCreate) -> dict:
    new_comment = {
        "id": f"comment-{uuid.uuid4().hex[:8]}",
        "essayId": data.essayId,
        "paragraphIndex": data.paragraphIndex,
        "content": data.content,
        "type": data.type,
        "presetType": data.presetType,
        "createdAt": datetime.utcnow().isoformat(),
    }
    return json_repository.create(COMMENTS_FILE, new_comment)


def update_comment(comment_id: str, updates: dict) -> Optional[dict]:
    return json_repository.update(COMMENTS_FILE, comment_id, updates)


def delete_comment(comment_id: str) -> bool:
    return json_repository.delete(COMMENTS_FILE, comment_id)


def get_preset_comments() -> List[dict]:
    return json_repository.get_all(PRESET_FILE)


def create_preset_comment(data: PresetCommentCreate) -> dict:
    new_preset = {
        "id": f"preset-{uuid.uuid4().hex[:8]}",
        "content": data.content,
        "type": data.type,
        "createdAt": datetime.utcnow().isoformat(),
    }
    return json_repository.create(PRESET_FILE, new_preset)


def delete_preset_comment(preset_id: str) -> bool:
    return json_repository.delete(PRESET_FILE, preset_id)
