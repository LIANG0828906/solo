import asyncio
from datetime import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import threading
import time

from database import init_db, get_db, Recall, RecallType, HeatCache
from heatmap_updater import update_heatmap, get_cached_heatmap, is_cache_valid
from locations import LOCATIONS

app = FastAPI(title="校舍回声日志 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SubmitRecallRequest(BaseModel):
    location_id: str
    type: RecallType
    content: str
    timestamp: str

class RecallResponse(BaseModel):
    id: str
    location_id: str
    type: RecallType
    content: str
    timestamp: str

class HeatDataResponse(BaseModel):
    location_id: str
    heat_score: float
    last_updated: str

def heatmap_updater_worker():
    while True:
        try:
            update_heatmap()
        except Exception as e:
            print(f"[Heatmap Worker] Error: {e}")
        time.sleep(600)

@app.on_event("startup")
def startup_event():
    init_db()
    print("[Startup] Database initialized")

    update_heatmap()
    print("[Startup] Initial heatmap calculated")

    updater_thread = threading.Thread(target=heatmap_updater_worker, daemon=True)
    updater_thread.start()
    print("[Startup] Heatmap updater thread started")

@app.post("/api/recall", response_model=RecallResponse)
def submit_recall(request: SubmitRecallRequest, db: Session = Depends(get_db)):
    valid_location_ids = [loc["id"] for loc in LOCATIONS]
    if request.location_id not in valid_location_ids:
        raise HTTPException(status_code=400, detail="Invalid location_id")

    try:
        timestamp = datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        timestamp = datetime.utcnow()

    db_recall = Recall(
        location_id=request.location_id,
        type=request.type,
        content=request.content,
        timestamp=timestamp
    )
    db.add(db_recall)
    db.commit()
    db.refresh(db_recall)

    return RecallResponse(
        id=str(db_recall.id),
        location_id=db_recall.location_id,
        type=db_recall.type,
        content=db_recall.content,
        timestamp=db_recall.timestamp.isoformat()
    )

@app.get("/api/recall/{location_id}", response_model=List[RecallResponse])
def get_recalls_by_location(location_id: str, db: Session = Depends(get_db)):
    valid_location_ids = [loc["id"] for loc in LOCATIONS]
    if location_id not in valid_location_ids:
        raise HTTPException(status_code=400, detail="Invalid location_id")

    recalls = db.query(Recall).filter(
        Recall.location_id == location_id
    ).order_by(Recall.timestamp.desc()).all()

    return [
        RecallResponse(
            id=str(r.id),
            location_id=r.location_id,
            type=r.type,
            content=r.content,
            timestamp=r.timestamp.isoformat()
        )
        for r in recalls
    ]

@app.get("/api/heatmap", response_model=List[HeatDataResponse])
def get_heatmap(db: Session = Depends(get_db)):
    cache_data = get_cached_heatmap()

    if is_cache_valid(cache_data):
        return [
            HeatDataResponse(
                location_id=item["location_id"],
                heat_score=item["heat_score"],
                last_updated=item["last_updated"]
            )
            for item in cache_data["data"]
        ]

    db_heat_data = db.query(HeatCache).all()

    if db_heat_data:
        return [
            HeatDataResponse(
                location_id=h.location_id,
                heat_score=h.heat_score,
                last_updated=h.last_updated.isoformat()
            )
            for h in db_heat_data
        ]

    update_heatmap()
    cache_data = get_cached_heatmap()

    if cache_data:
        return [
            HeatDataResponse(
                location_id=item["location_id"],
                heat_score=item["heat_score"],
                last_updated=item["last_updated"]
            )
            for item in cache_data["data"]
        ]

    return [
        HeatDataResponse(
            location_id=loc["id"],
            heat_score=0.0,
            last_updated=datetime.utcnow().isoformat()
        )
        for loc in LOCATIONS
    ]

@app.get("/api/locations")
def get_locations():
    return LOCATIONS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
