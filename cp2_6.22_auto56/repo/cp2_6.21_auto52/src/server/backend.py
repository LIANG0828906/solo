from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import hashlib
import time
import os
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "infographic.db")

DEFAULT_TEMPLATES = [
    {
        "id": "template-two-column",
        "name": "双栏对比",
        "category": "对比图",
        "thumbnail": "",
        "isTwoColumn": True,
        "columnGap": 40,
    },
    {
        "id": "template-timeline",
        "name": "水平时间线",
        "category": "时间线",
        "thumbnail": "",
    },
    {
        "id": "template-flow",
        "name": "垂直流程图",
        "category": "流程图",
        "thumbnail": "",
    },
    {
        "id": "template-cards",
        "name": "数据卡片",
        "category": "数据卡片",
        "thumbnail": "",
    },
    {
        "id": "template-person",
        "name": "人物介绍",
        "category": "人物介绍",
        "thumbnail": "",
    },
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            thumbnail TEXT,
            components_json TEXT,
            is_two_column INTEGER DEFAULT 0,
            column_gap INTEGER DEFAULT 40
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exports (
            id TEXT PRIMARY KEY,
            file_name TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            thumbnail TEXT,
            short_link TEXT UNIQUE NOT NULL,
            image_data TEXT
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM templates")
    count = cursor.fetchone()[0]
    if count == 0:
        for template in DEFAULT_TEMPLATES:
            cursor.execute("""
                INSERT INTO templates (id, name, category, thumbnail, components_json, is_two_column, column_gap)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                template["id"],
                template["name"],
                template["category"],
                template["thumbnail"],
                json.dumps([]),
                1 if template.get("isTwoColumn") else 0,
                template.get("columnGap", 40),
            ))

    conn.commit()
    conn.close()


def generate_short_link():
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    timestamp = str(time.time()).encode()
    random_str = os.urandom(8).hex().encode()
    hash_obj = hashlib.sha256(timestamp + random_str)
    hash_hex = hash_obj.hexdigest()
    
    short_hash = ""
    for i in range(8):
        idx = int(hash_hex[i * 2:i * 2 + 2], 16) % len(chars)
        short_hash += chars[idx]
    
    return f"https://infographic.app/{short_hash}"


class ExportRequest(BaseModel):
    imageData: str
    fileName: str


class TemplateResponse(BaseModel):
    id: str
    name: str
    category: str
    thumbnail: str
    isTwoColumn: Optional[bool] = None
    columnGap: Optional[int] = None


class ExportResponse(BaseModel):
    id: str
    shortLink: str


class ExportRecordResponse(BaseModel):
    id: str
    fileName: str
    timestamp: int
    thumbnail: str
    shortLink: str


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/api/templates", response_model=List[TemplateResponse])
async def get_templates():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM templates")
    rows = cursor.fetchall()
    conn.close()

    templates = []
    for row in rows:
        templates.append({
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "thumbnail": row["thumbnail"],
            "isTwoColumn": bool(row["is_two_column"]),
            "columnGap": row["column_gap"],
        })
    return templates


@app.get("/api/templates/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM templates WHERE id = ?", (template_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "thumbnail": row["thumbnail"],
        "isTwoColumn": bool(row["is_two_column"]),
        "columnGap": row["column_gap"],
    }


@app.post("/api/export", response_model=ExportResponse)
async def create_export(request: ExportRequest):
    export_id = hashlib.md5(str(time.time()).encode()).hexdigest()[:16]
    timestamp = int(time.time() * 1000)
    short_link = generate_short_link()

    conn = get_db()
    cursor = conn.cursor()

    max_retries = 5
    for i in range(max_retries):
        try:
            cursor.execute("""
                INSERT INTO exports (id, file_name, timestamp, thumbnail, short_link, image_data)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                export_id,
                request.fileName,
                timestamp,
                request.imageData[:1000] + "...",
                short_link,
                request.imageData,
            ))
            conn.commit()
            break
        except sqlite3.IntegrityError:
            if i == max_retries - 1:
                conn.close()
                raise HTTPException(status_code=500, detail="Failed to generate unique short link")
            short_link = generate_short_link()

    conn.close()

    return {
        "id": export_id,
        "shortLink": short_link,
    }


@app.get("/api/exports", response_model=List[ExportRecordResponse])
async def get_exports():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exports ORDER BY timestamp DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()

    exports = []
    for row in rows:
        exports.append({
            "id": row["id"],
            "fileName": row["file_name"],
            "timestamp": row["timestamp"],
            "thumbnail": row["thumbnail"],
            "shortLink": row["short_link"],
        })
    return exports


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
