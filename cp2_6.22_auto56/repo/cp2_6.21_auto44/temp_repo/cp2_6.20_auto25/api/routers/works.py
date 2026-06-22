from fastapi import APIRouter, Depends, Query
from typing import Optional
from database import get_db
from models.work import WorkResponse, WorkStatus
import aiosqlite

router = APIRouter(prefix="/works", tags=["works"])


@router.get("", response_model=list[WorkResponse])
async def list_works(
    status: Optional[WorkStatus] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: aiosqlite.Connection = Depends(get_db),
):
    query = "SELECT * FROM works WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status.value)
    if search:
        query += " AND (title LIKE ? OR uploader LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if date_from:
        query += " AND created_at >= ?"
        params.append(date_from)
    if date_to:
        query += " AND created_at <= ?"
        params.append(date_to)

    query += " ORDER BY created_at DESC"

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    works = [dict(row) for row in rows]
    return works


@router.get("/{work_id}", response_model=WorkResponse)
async def get_work(work_id: str, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT * FROM works WHERE id = ?", (work_id,))
    row = await cursor.fetchone()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Work not found")
    return dict(row)


@router.delete("/{work_id}")
async def delete_work(work_id: str, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT * FROM works WHERE id = ?", (work_id,))
    row = await cursor.fetchone()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Work not found")
    await db.execute("DELETE FROM works WHERE id = ?", (work_id,))
    await db.commit()
    return {"message": "Work deleted"}
