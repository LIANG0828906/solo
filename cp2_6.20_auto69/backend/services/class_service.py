from typing import List, Optional
from datetime import date
import uuid
from backend.repositories import json_repository
from backend.models.schemas import Class, ClassCreate


CLASSES_FILE = "classes.json"


def get_all_classes() -> List[dict]:
    return json_repository.get_all(CLASSES_FILE)


def get_class_by_id(class_id: str) -> Optional[dict]:
    return json_repository.get_by_id(CLASSES_FILE, class_id)


def create_class(data: ClassCreate) -> dict:
    new_class = {
        "id": f"class-{uuid.uuid4().hex[:8]}",
        "name": data.name,
        "studentCount": data.studentCount,
        "lastGradedDate": None,
    }
    return json_repository.create(CLASSES_FILE, new_class)


def update_last_graded(class_id: str, graded_date: Optional[date] = None) -> Optional[dict]:
    updates = {"lastGradedDate": graded_date.isoformat() if graded_date else date.today().isoformat()}
    return json_repository.update(CLASSES_FILE, class_id, updates)
