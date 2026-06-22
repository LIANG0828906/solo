from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os

router = APIRouter()

DATA_FILE = "desktop_data.json"

class DesktopIcon(BaseModel):
    id: str
    type: str
    name: str
    label: str
    x: float
    y: float
    width: float
    height: float
    parentId: Optional[str] = None
    color: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    createdAt: float
    updatedAt: float

class Folder(BaseModel):
    id: str
    name: str
    iconIds: List[str]
    viewMode: str = "grid"
    expanded: bool = False

class StickyNote(BaseModel):
    id: str
    title: str
    content: str
    color: str
    x: float
    y: float
    zIndex: int
    createdAt: float
    updatedAt: float

class GridSize(BaseModel):
    cols: int
    rows: int

class DesktopLayout(BaseModel):
    icons: List[DesktopIcon]
    folders: List[Folder]
    notes: List[StickyNote]
    gridSize: GridSize
    locked: bool = False
    lastSyncedAt: Optional[float] = None

class SaveLayoutRequest(BaseModel):
    layout: DesktopLayout

class CategoryRule(BaseModel):
    name: str
    extensions: List[str]
    keywords: List[str]

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return None

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

DEFAULT_CATEGORIES = [
    {
        "name": "图片",
        "extensions": [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp"],
        "keywords": ["image", "图片", "photo", "screenshot", "截图"]
    },
    {
        "name": "文档",
        "extensions": [".doc", ".docx", ".pdf", ".txt", ".md", ".xlsx", ".xls", ".ppt", ".pptx"],
        "keywords": ["document", "文档", "report", "报告", "note", "笔记"]
    },
    {
        "name": "应用",
        "extensions": [".exe", ".app", ".dmg", ".apk"],
        "keywords": ["app", "应用", "program", "程序", "software", "软件"]
    },
    {
        "name": "链接",
        "extensions": [".url", ".webloc"],
        "keywords": ["link", "链接", "url", "website", "网站"]
    }
]

@router.get("/layout")
async def get_layout():
    data = load_data()
    if data:
        return {"success": True, "data": data, "syncedAt": data.get("lastSyncedAt")}
    return {
        "success": True,
        "data": {
            "icons": [],
            "folders": [],
            "notes": [],
            "gridSize": {"cols": 8, "rows": 6},
            "locked": False
        },
        "syncedAt": None
    }

@router.post("/layout")
async def save_layout(request: SaveLayoutRequest):
    layout_dict = request.layout.model_dump()
    layout_dict["lastSyncedAt"] = __import__("time").time()
    save_data(layout_dict)
    return {"success": True, "syncedAt": layout_dict["lastSyncedAt"]}

@router.get("/organizer/rules")
async def get_organizer_rules():
    return {
        "success": True,
        "data": {
            "categories": DEFAULT_CATEGORIES
        }
    }
