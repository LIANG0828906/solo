import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from models import TrainingRecordCreate, TrainingRecord, Achievement, MonthStats
from services.record_service import get_all_records, add_record
from services.achievement_service import get_all_achievements, check_and_unlock_achievements
from services.stats_service import get_month_stats

app = FastAPI(title="健身追踪 API", description="健身记录追踪系统后端 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def read_root():
    return {"message": "健身追踪 API 运行中", "version": "1.0.0"}


@app.get("/api/records", response_model=list[TrainingRecord])
def get_records():
    return get_all_records()


@app.post("/api/records", response_model=TrainingRecord)
def create_record(record: TrainingRecordCreate):
    return add_record(record)


@app.get("/api/achievements", response_model=list[Achievement])
def get_achievements():
    return get_all_achievements()


@app.get("/api/stats", response_model=MonthStats)
def get_stats(month: str):
    return get_month_stats(month)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
