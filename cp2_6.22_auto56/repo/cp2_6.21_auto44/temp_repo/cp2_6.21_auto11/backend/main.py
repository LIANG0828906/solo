from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
import uuid
import time
import io
import csv
from models import init_db, get_db, Event, Checkin

app = FastAPI(title="活动签到与热力图分析 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_limit_store = {}
RATE_LIMIT_SECONDS = 5


class CreateEventRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=256, description="活动名称")
    date: str = Field(..., min_length=1, description="活动日期时间")
    location: str = Field(..., min_length=1, max_length=128, description="活动地点")


class CheckinRequest(BaseModel):
    event_id: str = Field(..., min_length=1, description="活动ID")
    participant_name: str = Field(..., min_length=1, max_length=128, description="参与者姓名")
    device_id: str = Field(..., min_length=1, description="设备唯一ID")
    x: Optional[float] = Field(50.0, ge=0, le=100, description="X坐标 (0-100)")
    y: Optional[float] = Field(50.0, ge=0, le=100, description="Y坐标 (0-100)")


@app.on_event("startup")
async def startup_event():
    init_db()


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.post("/api/events")
async def create_event(req: CreateEventRequest, db: Session = Depends(get_db)):
    event_id = uuid.uuid4().hex[:12]

    event = Event(
        id=event_id,
        name=req.name.strip(),
        date=req.date,
        location=req.location.strip(),
        created_at=datetime.utcnow(),
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "id": event.id,
        "name": event.name,
        "date": event.date,
        "location": event.location,
        "created_at": event.created_at.isoformat(),
    }


@app.post("/api/checkin")
async def checkin(req: CheckinRequest, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="活动不存在")

    now = time.time()
    rate_key = f"{req.event_id}:{req.device_id}"
    last_checkin = _rate_limit_store.get(rate_key, 0)

    if now - last_checkin < RATE_LIMIT_SECONDS:
        wait_time = RATE_LIMIT_SECONDS - (now - last_checkin)
        raise HTTPException(
            status_code=429,
            detail=f"签到过于频繁，请{wait_time:.0f}秒后再试"
        )

    _rate_limit_store[rate_key] = now

    existing_count = db.query(func.count(Checkin.id)).filter(
        Checkin.event_id == req.event_id
    ).scalar() or 0

    checkin_record = Checkin(
        event_id=req.event_id,
        participant_name=req.participant_name.strip(),
        device_id=req.device_id,
        timestamp=datetime.utcnow(),
        x=req.x,
        y=req.y,
        checkin_number=existing_count + 1,
    )

    db.add(checkin_record)
    db.commit()
    db.refresh(checkin_record)

    return {
        "success": True,
        "participant_name": checkin_record.participant_name,
        "checkin_number": checkin_record.checkin_number,
        "timestamp": checkin_record.timestamp.isoformat(),
        "event_id": checkin_record.event_id,
        "message": "签到成功",
    }


@app.get("/api/events/{event_id}/stats")
async def get_event_stats(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="活动不存在")

    checkins = (
        db.query(Checkin)
        .filter(Checkin.event_id == event_id)
        .order_by(Checkin.timestamp.asc())
        .all()
    )

    total_checkins = len(checkins)

    checkins_over_time = build_time_series(checkins, event)

    checkin_list = [
        {
            "id": c.id,
            "participant_name": c.participant_name,
            "timestamp": c.timestamp.isoformat(),
            "x": c.x,
            "y": c.y,
            "checkin_number": c.checkin_number,
        }
        for c in checkins
    ]

    return {
        "event": {
            "id": event.id,
            "name": event.name,
            "date": event.date,
            "location": event.location,
            "created_at": event.created_at.isoformat(),
        },
        "total_checkins": total_checkins,
        "checkins_over_time": checkins_over_time,
        "checkins": checkin_list,
    }


def build_time_series(checkins: List[Checkin], event: Event) -> List[dict]:
    if not checkins:
        return []

    try:
        event_start = datetime.fromisoformat(event.date.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        event_start = checkins[0].timestamp.replace(tzinfo=None)

    if event_start.tzinfo:
        event_start = event_start.replace(tzinfo=None)

    first_ts = min(event_start, checkins[0].timestamp)
    last_ts = max(checkins[-1].timestamp, datetime.utcnow())

    total_duration = last_ts - first_ts
    total_seconds = max(int(total_duration.total_seconds()), 60)

    if total_seconds <= 300:
        bucket_seconds = 30
        fmt = "%H:%M:%S"
    elif total_seconds <= 3600:
        bucket_seconds = 60
        fmt = "%H:%M"
    elif total_seconds <= 86400:
        bucket_seconds = 300
        fmt = "%H:%M"
    else:
        bucket_seconds = 3600
        fmt = "%m-%d %H:%M"

    bucket_start = first_ts.replace(
        minute=(first_ts.minute // (bucket_seconds // 60 or 1)) * (bucket_seconds // 60 or 1),
        second=0,
        microsecond=0,
    )

    buckets = []
    current = bucket_start
    while current <= last_ts + timedelta(seconds=bucket_seconds):
        buckets.append({
            "time": current.strftime(fmt),
            "start": current,
            "end": current + timedelta(seconds=bucket_seconds),
            "count": 0,
        })
        current += timedelta(seconds=bucket_seconds)

    cumulative = 0
    for bucket in buckets:
        for c in checkins:
            if bucket["start"] <= c.timestamp < bucket["end"]:
                bucket["count"] += 1
        cumulative += bucket["count"]
        bucket["cumulative"] = cumulative

    result = [
        {
            "time": b["time"],
            "count": b["count"],
            "cumulative": b["cumulative"],
        }
        for b in buckets
    ]

    if len(result) > 24:
        step = len(result) // 24 or 1
        result = result[::step]

    return result


@app.get("/api/events/{event_id}/export")
async def export_checkins(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="活动不存在")

    checkins = (
        db.query(Checkin)
        .filter(Checkin.event_id == event_id)
        .order_by(Checkin.checkin_number.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["序号", "参与者姓名", "签到时间", "位置 X", "位置 Y", "签到顺序号"])

    for idx, c in enumerate(checkins, 1):
        writer.writerow([
            idx,
            c.participant_name,
            c.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            round(c.x, 2),
            round(c.y, 2),
            c.checkin_number,
        ])

    csv_content = output.getvalue()

    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=event-{event_id}-checkins.csv"
        }
    )


@app.get("/api/events")
async def list_events(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    events = (
        db.query(Event)
        .order_by(Event.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for event in events:
        count = db.query(func.count(Checkin.id)).filter(
            Checkin.event_id == event.id
        ).scalar() or 0
        result.append({
            "id": event.id,
            "name": event.name,
            "date": event.date,
            "location": event.location,
            "created_at": event.created_at.isoformat(),
            "checkin_count": count,
        })

    return result


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }
