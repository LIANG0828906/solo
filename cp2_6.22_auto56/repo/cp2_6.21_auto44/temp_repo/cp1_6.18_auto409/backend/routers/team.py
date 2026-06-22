from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from ..models import DailyRecord
from ..database import get_db

router = APIRouter()


@router.get("/progress")
def get_team_progress(db: Session = Depends(get_db)):
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=29)

    results = db.query(
        DailyRecord.date,
        func.sum(DailyRecord.steps).label('total_steps'),
        func.avg(DailyRecord.calories).label('avg_calories')
    ).filter(
        DailyRecord.date >= start_date,
        DailyRecord.date <= today
    ).group_by(
        DailyRecord.date
    ).order_by(
        DailyRecord.date.asc()
    ).all()

    daily_totals = [
        {
            "date": r.date.isoformat(),
            "total_steps": r.total_steps,
            "avg_calories": int(r.avg_calories) if r.avg_calories is not None else 0
        }
        for r in results
    ]

    total_steps = sum(d["total_steps"] for d in daily_totals)
    total_calories = sum(d["avg_calories"] for d in daily_totals)
    goal_days = sum(1 for d in daily_totals if d["total_steps"] >= 100000)

    current_day_steps = 0
    if daily_totals and daily_totals[-1]["date"] == today.isoformat():
        current_day_steps = daily_totals[-1]["total_steps"]

    return {
        "daily_totals": daily_totals,
        "total_steps": total_steps,
        "total_calories": total_calories,
        "goal_days": goal_days,
        "current_day_steps": current_day_steps
    }
