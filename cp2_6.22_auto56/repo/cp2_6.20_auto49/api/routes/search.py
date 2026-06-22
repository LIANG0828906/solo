from fastapi import APIRouter, Query

from api.database import get_db
from api.models import Note

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=list[Note])
async def search_notes(
    q: str | None = Query(None, alias="q"),
    tags: str | None = Query(None, alias="tags"),
    from_: str | None = Query(None, alias="from"),
    to: str | None = Query(None, alias="to"),
):
    db = await get_db()

    conditions: list[str] = []
    params: list[str] = []

    if q:
        conditions.append("(n.title LIKE ? OR n.content LIKE ?)")
        params.extend([f"%{q}%", f"%{q}%"])

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            placeholders = ",".join("?" for _ in tag_list)
            conditions.append(
                f"n.id IN (SELECT nt.note_id FROM note_tags nt JOIN tags t ON nt.tag_id = t.id WHERE t.category IN ({placeholders}))"
            )
            params.extend(tag_list)

    if from_:
        conditions.append("n.created_at >= ?")
        params.append(from_)

    if to:
        conditions.append("n.created_at <= ?")
        params.append(to)

    where = " AND ".join(conditions) if conditions else "1=1"
    sql = f"SELECT n.* FROM notes n WHERE {where} ORDER BY n.updated_at DESC"

    cursor = await db.execute(sql, params)
    rows = await cursor.fetchall()

    results: list[Note] = []
    for r in rows:
        note_id = r["id"]
        tag_cursor = await db.execute(
            """
            SELECT t.id, t.name, t.category
            FROM tags t JOIN note_tags nt ON t.id = nt.tag_id
            WHERE nt.note_id = ?
            """,
            (note_id,),
        )
        tag_rows = await tag_cursor.fetchall()
        tags_list = [
            {"id": t["id"], "name": t["name"], "category": t["category"]}
            for t in tag_rows
        ]

        ref_cursor = await db.execute(
            "SELECT target_id FROM link_relations WHERE source_id = ? AND type = 'reference'",
            (note_id,),
        )
        ref_rows = await ref_cursor.fetchall()
        ref_ids = [rr["target_id"] for rr in ref_rows]

        results.append(
            Note(
                id=note_id,
                title=r["title"],
                content=r["content"],
                summary=r["summary"],
                tags=tags_list,
                createdAt=r["created_at"],
                updatedAt=r["updated_at"],
                referenceIds=ref_ids,
            )
        )

    return results
