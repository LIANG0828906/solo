import json
import os
from typing import Any, List, Optional
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)


def _get_file_path(filename: str) -> Path:
    return DATA_DIR / filename


def read_json(filename: str, default: Any = None) -> Any:
    file_path = _get_file_path(filename)
    if not file_path.exists():
        return default if default is not None else []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default if default is not None else []


def write_json(filename: str, data: Any) -> None:
    file_path = _get_file_path(filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_all(filename: str) -> List[dict]:
    return read_json(filename, [])


def get_by_id(filename: str, item_id: str) -> Optional[dict]:
    items = get_all(filename)
    for item in items:
        if item.get("id") == item_id:
            return item
    return None


def create(filename: str, item: dict) -> dict:
    items = get_all(filename)
    items.append(item)
    write_json(filename, items)
    return item


def update(filename: str, item_id: str, updates: dict) -> Optional[dict]:
    items = get_all(filename)
    for i, item in enumerate(items):
        if item.get("id") == item_id:
            items[i].update(updates)
            write_json(filename, items)
            return items[i]
    return None


def delete(filename: str, item_id: str) -> bool:
    items = get_all(filename)
    new_items = [item for item in items if item.get("id") != item_id]
    if len(new_items) != len(items):
        write_json(filename, new_items)
        return True
    return False


def filter_by(filename: str, **kwargs) -> List[dict]:
    items = get_all(filename)
    result = []
    for item in items:
        match = True
        for key, value in kwargs.items():
            if item.get(key) != value:
                match = False
                break
        if match:
            result.append(item)
    return result
