from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.database import get_db
from api.models import Tag

router = APIRouter(prefix="/api/tags", tags=["tags"])


class TagUpdate(BaseModel):
    name: str | None = None
    category: str | None = None


@router.put("/{tag_id}", response_model=Tag)
async def update_tag(tag_id: str, payload: TagUpdate):
    db = await get_db()
    cursor = await db.execute("SELECT * FROM tags WHERE id = ?", (tag_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Tag not found")

    new_name = payload.name if payload.name is not None else row["name"]
    new_category = payload.category if payload.category is not None else row["category"]

    await db.execute(
        "UPDATE tags SET name = ?, category = ? WHERE id = ?",
        (new_name, new_category, tag_id),
    )
    await db.commit()

    cursor = await db.execute("SELECT * FROM tags WHERE id = ?", (tag_id,))
    row = await cursor.fetchone()
    return Tag(id=row["id"], name=row["name"], category=row["category"])


@router.get("", response_model=list[Tag])
async def list_tags():
    db = await get_db()
    cursor = await db.execute("SELECT * FROM tags ORDER BY name")
    rows = await cursor.fetchall()
    return [Tag(id=r["id"], name=r["name"], category=r["category"]) for r in rows]
