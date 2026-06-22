from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from collections import defaultdict

from models import Base, engine, SessionLocal, Mood

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MoodCreate(BaseModel):
    emotion: str
    intensity: int
    description: Optional[str] = None
    tags: Optional[str] = None


class MoodResponse(BaseModel):
    id: int
    user_id: str
    emotion: str
    intensity: int
    description: Optional[str]
    tags: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@app.post("/api/moods", response_model=MoodResponse)
def create_mood(mood: MoodCreate, db: Session = Depends(get_db)):
    db_mood = Mood(
        user_id="default",
        emotion=mood.emotion,
        intensity=mood.intensity,
        description=mood.description,
        tags=mood.tags,
    )
    db.add(db_mood)
    db.commit()
    db.refresh(db_mood)
    return db_mood


@app.get("/api/moods", response_model=List[MoodResponse])
def get_moods(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    tag: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Mood)

    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(Mood.created_at >= start_dt)
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(Mood.created_at <= end_dt)
    if tag:
        query = query.filter(Mood.tags.like(f"%{tag}%"))

    query = query.order_by(Mood.created_at.desc())

    if limit:
        query = query.limit(limit)

    return query.all()


@app.get("/api/moods/calendar")
def get_calendar_data(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    moods = db.query(Mood).filter(
        Mood.created_at >= start_date,
        Mood.created_at < end_date,
    ).all()

    calendar_data = defaultdict(list)
    for mood in moods:
        day = mood.created_at.day
        calendar_data[day].append({
            "id": mood.id,
            "emotion": mood.emotion,
            "intensity": mood.intensity,
            "tags": mood.tags.split(",") if mood.tags else [],
        })

    return {"year": year, "month": month, "data": dict(calendar_data)}


@app.get("/api/moods/analysis")
def get_analysis_data(
    days: int = Query(..., ge=1, le=365),
    db: Session = Depends(get_db),
):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    moods = db.query(Mood).filter(
        Mood.created_at >= start_date,
        Mood.created_at <= end_date,
    ).all()

    emotion_counts = defaultdict(int)
    intensity_sum = 0
    tag_counts = defaultdict(int)
    daily_moods = defaultdict(list)

    for mood in moods:
        emotion_counts[mood.emotion] += 1
        intensity_sum += mood.intensity
        if mood.tags:
            for tag in mood.tags.split(","):
                tag = tag.strip()
                if tag:
                    tag_counts[tag] += 1
        day_key = mood.created_at.strftime("%Y-%m-%d")
        daily_moods[day_key].append(mood.intensity)

    avg_intensity = intensity_sum / len(moods) if moods else 0
    avg_daily_intensity = {
        day: sum(intensities) / len(intensities)
        for day, intensities in daily_moods.items()
    }

    return {
        "days": days,
        "total_records": len(moods),
        "emotion_distribution": dict(emotion_counts),
        "average_intensity": round(avg_intensity, 2),
        "tag_distribution": dict(tag_counts),
        "daily_average_intensity": avg_daily_intensity,
    }


@app.get("/api/reports/weekly")
def get_weekly_report(db: Session = Depends(get_db)):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)

    moods = db.query(Mood).filter(
        Mood.created_at >= start_date,
        Mood.created_at <= end_date,
    ).order_by(Mood.created_at.asc()).all()

    if not moods:
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_records": 0,
            "summary": "本周暂无情绪记录",
            "details": [],
        }

    emotion_counts = defaultdict(int)
    intensity_sum = 0
    tag_counts = defaultdict(int)
    daily_data = defaultdict(list)

    for mood in moods:
        emotion_counts[mood.emotion] += 1
        intensity_sum += mood.intensity
        if mood.tags:
            for tag in mood.tags.split(","):
                tag = tag.strip()
                if tag:
                    tag_counts[tag] += 1
        day_key = mood.created_at.strftime("%Y-%m-%d")
        daily_data[day_key].append({
            "emotion": mood.emotion,
            "intensity": mood.intensity,
            "description": mood.description,
        })

    avg_intensity = intensity_sum / len(moods)
    top_emotion = max(emotion_counts, key=emotion_counts.get)
    top_tag = max(tag_counts, key=tag_counts.get) if tag_counts else None

    details = []
    for day in sorted(daily_data.keys()):
        day_moods = daily_data[day]
        day_avg_intensity = sum(m["intensity"] for m in day_moods) / len(day_moods)
        details.append({
            "date": day,
            "count": len(day_moods),
            "average_intensity": round(day_avg_intensity, 2),
            "moods": day_moods,
        })

    summary = (
        f"本周共记录 {len(moods)} 条情绪，"
        f"平均强度 {round(avg_intensity, 2)}，"
        f"最常出现的情绪是 {top_emotion}，"
        f"最常出现的标签是 {top_tag if top_tag else '无'}。"
    )

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_records": len(moods),
        "average_intensity": round(avg_intensity, 2),
        "top_emotion": top_emotion,
        "top_tag": top_tag,
        "emotion_distribution": dict(emotion_counts),
        "tag_distribution": dict(tag_counts),
        "summary": summary,
        "details": details,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
