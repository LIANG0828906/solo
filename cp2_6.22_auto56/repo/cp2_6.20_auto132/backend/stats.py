from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import date
from models import TrainingRecord
from schemas import MonthlyStatsResponse, DailyStats, TypeDistribution


def calculate_monthly_stats(db: Session, month: str) -> MonthlyStatsResponse:
    year, month_num = map(int, month.split("-"))

    records = db.query(TrainingRecord).filter(
        extract('year', TrainingRecord.date) == year,
        extract('month', TrainingRecord.date) == month_num
    ).all()

    total_duration = sum(r.duration for r in records)
    total_count = len(records)

    daily_dict = {}
    for r in records:
        day = r.date.day
        if day not in daily_dict:
            daily_dict[day] = 0
        daily_dict[day] += r.duration

    daily_stats = [DailyStats(day=day, duration=duration) for day, duration in sorted(daily_dict.items())]

    type_dict = {}
    for r in records:
        workout_type = r.type
        if workout_type not in type_dict:
            type_dict[workout_type] = {"duration": 0, "count": 0}
        type_dict[workout_type]["duration"] += r.duration
        type_dict[workout_type]["count"] += 1

    type_distribution = [
        TypeDistribution(type=t, duration=data["duration"], count=data["count"])
        for t, data in type_dict.items()
    ]

    return MonthlyStatsResponse(
        month=month,
        total_duration=total_duration,
        total_count=total_count,
        daily_stats=daily_stats,
        type_distribution=type_distribution
    )
