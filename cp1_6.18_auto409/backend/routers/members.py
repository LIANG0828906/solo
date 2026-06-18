from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from ..models import Member, DailyRecord
from ..database import get_db

router = APIRouter()


@router.get("/{member_id}")
def get_member_detail(member_id: int, db: Session = Depends(get_db)):
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=6)

    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="成员不存在")

    records = db.query(DailyRecord).filter(
        DailyRecord.member_id == member_id,
        DailyRecord.date >= start_date,
        DailyRecord.date <= today
    ).order_by(DailyRecord.date.asc()).all()

    total_steps = sum(r.steps for r in records)
    total_calories = sum(r.calories for r in records)
    avg_duration = int(sum(r.duration for r in records) / len(records)) if records else 0

    records_list = [
        {
            "date": r.date.isoformat(),
            "steps": r.steps,
            "duration": r.duration,
            "calories": r.calories
        }
        for r in records
    ]

    return {
        "id": member.id,
        "nickname": member.nickname,
        "avatar_url": member.avatar_url,
        "records": records_list,
        "total_steps": total_steps,
        "total_calories": total_calories,
        "avg_duration": avg_duration
    }
