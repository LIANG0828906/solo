from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from ..models import Member, DailyRecord
from ..database import get_db

router = APIRouter()


@router.get("/")
def get_rankings(
    days: int = Query(7, description="时间范围天数"),
    db: Session = Depends(get_db)
):
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days - 1)

    results = db.query(
        Member.id,
        Member.nickname,
        Member.avatar_url,
        func.sum(DailyRecord.steps).label('total_steps'),
        func.sum(DailyRecord.calories).label('total_calories')
    ).join(
        DailyRecord, Member.id == DailyRecord.member_id
    ).filter(
        DailyRecord.date >= start_date,
        DailyRecord.date <= today
    ).group_by(
        Member.id
    ).order_by(
        func.sum(DailyRecord.steps).desc()
    ).all()

    return [
        {
            "id": r.id,
            "nickname": r.nickname,
            "avatar_url": r.avatar_url,
            "total_steps": r.total_steps,
            "total_calories": r.total_calories
        }
        for r in results
    ]
