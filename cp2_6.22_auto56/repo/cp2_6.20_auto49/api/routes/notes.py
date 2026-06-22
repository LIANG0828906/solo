import re
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from api.database import get_db
from api.models import Backlink, Note, NoteCreate, NoteUpdate

router = APIRouter(prefix="/api/notes", tags=["notes"])

WIKI_PATTERN = re.compile(r"\[\[(.+?)\]\]")


async def _fetch_note_tags(db, note_id: str) -> list[dict]:
    cursor = await db.execute(
        """
        SELECT t.id, t.name, t.category
        FROM tags t JOIN note_tags nt ON t.id = nt.tag_id
        WHERE nt.note_id = ?
        """,
        (note_id,),
    )
    rows = await cursor.fetchall()
    return [{"id": r["id"], "name": r["name"], "category": r["category"]} for r in rows]


async def _fetch_reference_ids(db, note_id: str) -> list[str]:
    cursor = await db.execute(
        "SELECT target_id FROM link_relations WHERE source_id = ? AND type = 'reference'",
        (note_id,),
    )
    rows = await cursor.fetchall()
    return [r["target_id"] for r in rows]


async def _build_note(db, row) -> Note:
    note_id = row["id"]
    tags = await _fetch_note_tags(db, note_id)
    reference_ids = await _fetch_reference_ids(db, note_id)
    return Note(
        id=note_id,
        title=row["title"],
        content=row["content"],
        summary=row["summary"],
        tags=tags,
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
        referenceIds=reference_ids,
    )


async def _sync_reference_links(db, note_id: str, content: str):
    await db.execute(
        "DELETE FROM link_relations WHERE source_id = ? AND type = 'reference'",
        (note_id,),
    )
    titles = set(WIKI_PATTERN.findall(content))
    for title in titles:
        cursor = await db.execute("SELECT id FROM notes WHERE title = ?", (title,))
        target = await cursor.fetchone()
        if target and target["id"] != note_id:
            await db.execute(
                "INSERT OR IGNORE INTO link_relations (source_id, target_id, type) VALUES (?, ?, 'reference')",
                (note_id, target["id"]),
            )


async def _ensure_tags_exist(db, tag_ids: list[str]):
    for tid in tag_ids:
        cursor = await db.execute("SELECT id FROM tags WHERE id = ?", (tid,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"Tag {tid} not found")


async def _sync_note_tags(db, note_id: str, tag_ids: list[str]):
    await db.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
    for tid in tag_ids:
        await db.execute(
            "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)",
            (note_id, tid),
        )


def _generate_summary(content: str) -> str:
    return content[:100]


@router.get("", response_model=list[Note])
async def list_notes():
    db = await get_db()
    cursor = await db.execute("SELECT * FROM notes ORDER BY updated_at DESC")
    rows = await cursor.fetchall()
    return [await _build_note(db, r) for r in rows]


@router.get("/{note_id}", response_model=Note)
async def get_note(note_id: str):
    db = await get_db()
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return await _build_note(db, row)


@router.post("", response_model=Note, status_code=201)
async def create_note(payload: NoteCreate):
    db = await get_db()
    note_id = uuid4().hex
    summary = _generate_summary(payload.content)
    if payload.tagIds:
        await _ensure_tags_exist(db, payload.tagIds)
    await db.execute(
        "INSERT INTO notes (id, title, content, summary) VALUES (?, ?, ?, ?)",
        (note_id, payload.title, payload.content, summary),
    )
    await _sync_note_tags(db, note_id, payload.tagIds)
    await _sync_reference_links(db, note_id, payload.content)
    await db.commit()
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = await cursor.fetchone()
    return await _build_note(db, row)


@router.put("/{note_id}", response_model=Note)
async def update_note(note_id: str, payload: NoteUpdate):
    db = await get_db()
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")

    title = payload.title if payload.title is not None else row["title"]
    content = payload.content if payload.content is not None else row["content"]
    summary = _generate_summary(content)

    await db.execute(
        "UPDATE notes SET title = ?, content = ?, summary = ?, updated_at = datetime('now') WHERE id = ?",
        (title, content, summary, note_id),
    )

    if payload.tagIds is not None:
        await _ensure_tags_exist(db, payload.tagIds)
        await _sync_note_tags(db, note_id, payload.tagIds)

    await _sync_reference_links(db, note_id, content)
    await db.commit()

    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = await cursor.fetchone()
    return await _build_note(db, row)


@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: str):
    db = await get_db()
    cursor = await db.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Note not found")
    await db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    await db.commit()


@router.get("/{note_id}/backlinks", response_model=list[Backlink])
async def get_backlinks(note_id: str):
    db = await get_db()
    cursor = await db.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Note not found")

    cursor = await db.execute(
        """
        SELECT n.id, n.title, n.content
        FROM notes n
        JOIN link_relations lr ON n.id = lr.source_id
        WHERE lr.target_id = ? AND lr.type = 'reference'
        """,
        (note_id,),
    )
    rows = await cursor.fetchall()
    return [
        Backlink(noteId=r["id"], title=r["title"], snippet=r["content"][:150])
        for r in rows
    ]
