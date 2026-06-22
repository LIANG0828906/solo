from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional

from database import SessionLocal
from models import User, HealthRecord, Goal

router = APIRouter(prefix="/health", tags=["health"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class HealthRecordCreate(BaseModel):
    user_id: int
    date: str
    weight: Optional[float] = 0.0
    steps: Optional[int] = 0
    sleep_hours: Optional[float] = 0.0
    water_cups: Optional[int] = 0


class GoalUpdate(BaseModel):
    id: Optional[int] = None
    user_id: int
    target_weight: Optional[float] = 65.0
    target_steps: Optional[int] = 8000
    target_sleep: Optional[float] = 8.0
    target_water: Optional[int] = 8


@router.post("/record")
def create_or_update_record(record: HealthRecordCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    record_date = date.fromisoformat(record.date)
    existing = db.query(HealthRecord).filter(
        HealthRecord.user_id == record.user_id,
        HealthRecord.date == record_date
    ).first()

    if existing:
        existing.weight = record.weight
        existing.steps = record.steps
        existing.sleep_hours = record.sleep_hours
        existing.water_cups = record.water_cups
        db.commit()
        db.refresh(existing)
        return existing

    new_record = HealthRecord(
        user_id=record.user_id,
        date=record_date,
        weight=record.weight,
        steps=record.steps,
        sleep_hours=record.sleep_hours,
        water_cups=record.water_cups
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/today")
def get_today_record(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    record = db.query(HealthRecord).filter(
        HealthRecord.user_id == user_id,
        HealthRecord.date == today
    ).first()

    if not record:
        new_record = HealthRecord(
            user_id=user_id,
            date=today,
            weight=0.0,
            steps=0,
            sleep_hours=0.0,
            water_cups=0
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

    return record


@router.get("/week")
def get_week_trend(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    week_ago = today - timedelta(days=6)

    records = db.query(HealthRecord).filter(
        HealthRecord.user_id == user_id,
        HealthRecord.date >= week_ago,
        HealthRecord.date <= today
    ).order_by(HealthRecord.date).all()

    record_map = {r.date: r for r in records}

    result = []
    for i in range(7):
        d = today - timedelta(days=6 - i)
        if d in record_map:
            r = record_map[d]
            result.append({
                "date": d.isoformat(),
                "weight": r.weight,
                "steps": r.steps,
                "sleep_hours": r.sleep_hours,
                "water_cups": r.water_cups
            })
        else:
            result.append({
                "date": d.isoformat(),
                "weight": 0.0,
                "steps": 0,
                "sleep_hours": 0.0,
                "water_cups": 0
            })

    return result


@router.get("/goal")
def get_goal(user_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.user_id == user_id).first()
    if not goal:
        goal = Goal(user_id=user_id)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal


@router.put("/goal")
def update_goal(goal: GoalUpdate, db: Session = Depends(get_db)):
    existing = db.query(Goal).filter(Goal.user_id == goal.user_id).first()
    if not existing:
        new_goal = Goal(
            user_id=goal.user_id,
            target_weight=goal.target_weight,
            target_steps=goal.target_steps,
            target_sleep=goal.target_sleep,
            target_water=goal.target_water
        )
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        return new_goal

    existing.target_weight = goal.target_weight
    existing.target_steps = goal.target_steps
    existing.target_sleep = goal.target_sleep
    existing.target_water = goal.target_water
    db.commit()
    db.refresh(existing)
    return existing
