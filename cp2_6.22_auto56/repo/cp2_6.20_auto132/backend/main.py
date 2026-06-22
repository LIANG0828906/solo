from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from crud import init_db, get_db, get_records, create_record, get_achievements_with_status
from schemas import TrainingRecordCreate, TrainingRecordResponse, AchievementResponse, MonthlyStatsResponse
from achievements import check_achievements
from stats import calculate_monthly_stats

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/records", response_model=List[TrainingRecordResponse])
def read_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = get_records(db, skip=skip, limit=limit)
    return records


@app.post("/api/records", response_model=TrainingRecordResponse)
def create_new_record(record: TrainingRecordCreate, db: Session = Depends(get_db)):
    db_record = create_record(db=db, record=record)
    check_achievements(db)
    return db_record


@app.get("/api/achievements", response_model=List[AchievementResponse])
def read_achievements(db: Session = Depends(get_db)):
    return get_achievements_with_status(db)


@app.get("/api/stats", response_model=MonthlyStatsResponse)
def read_monthly_stats(
    month: str = Query(..., description="月份格式: YYYY-MM"),
    db: Session = Depends(get_db)
):
    return calculate_monthly_stats(db, month)
