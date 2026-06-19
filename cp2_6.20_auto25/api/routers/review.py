from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models.work import ReviewRequest
import aiosqlite

router = APIRouter(tags=["review"])


@router.put("/works/{work_id}/review")
async def review_work(
    work_id: str,
    review: ReviewRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute("SELECT * FROM works WHERE id = ?", (work_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Work not found")

    if review.action == "approve":
        await db.execute(
            "UPDATE works SET status = 'published', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (work_id,),
        )
    else:
        await db.execute(
            "UPDATE works SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reject_reason = ? WHERE id = ?",
            (review.reject_reason, work_id),
        )

    await db.commit()

    cursor = await db.execute("SELECT * FROM works WHERE id = ?", (work_id,))
    updated = await cursor.fetchone()
    return dict(updated)
