import random
import time
import uuid
import csv
from io import StringIO
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from mock_data import (
    generate_promotions,
    generate_realtime_stats,
    generate_history_data,
    generate_abtests,
    generate_groups
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PromotionConfig(BaseModel):
    discount: Optional[float] = None
    fullAmount: Optional[int] = None
    reduceAmount: Optional[int] = None
    gift: Optional[str] = None


class PromotionCreate(BaseModel):
    name: str
    type: str = Field(..., pattern="^(discount|full_reduction|gift)$")
    config: PromotionConfig
    startTime: str
    endTime: str
    categories: List[str]


class PromotionUpdate(PromotionCreate):
    status: Optional[str] = Field(None, pattern="^(active|paused|ended)$")


class ABTestCreate(BaseModel):
    name: str
    description: str
    groupAName: str
    groupBName: str


promotions_db = generate_promotions(500)
abtests_db = generate_abtests()
groups_db = generate_groups()


@app.get("/api/promotions")
async def get_promotions():
    time.sleep(0.2)
    return {"data": promotions_db, "total": len(promotions_db)}


@app.post("/api/promotions")
async def create_promotion(promo: PromotionCreate):
    new_promo = {
        "id": str(uuid.uuid4()),
        "name": promo.name,
        "type": promo.type,
        "config": promo.config.model_dump(exclude_none=True),
        "startTime": promo.startTime,
        "endTime": promo.endTime,
        "categories": promo.categories,
        "status": "active",
        "createdAt": datetime.now().isoformat()
    }
    promotions_db.insert(0, new_promo)
    return {"data": new_promo}


@app.put("/api/promotions/{promo_id}")
async def update_promotion(promo_id: str, promo: PromotionUpdate):
    for i, p in enumerate(promotions_db):
        if p["id"] == promo_id:
            update_data = promo.model_dump(exclude_none=True)
            if "config" in update_data:
                update_data["config"] = promo.config.model_dump(exclude_none=True)
            promotions_db[i].update(update_data)
            return {"data": promotions_db[i]}
    raise HTTPException(status_code=404, detail="Promotion not found")


@app.delete("/api/promotions/{promo_id}")
async def delete_promotion(promo_id: str):
    for i, p in enumerate(promotions_db):
        if p["id"] == promo_id:
            deleted = promotions_db.pop(i)
            return {"data": deleted}
    raise HTTPException(status_code=404, detail="Promotion not found")


@app.post("/api/promotions/{promo_id}/toggle")
async def toggle_promotion(promo_id: str):
    for p in promotions_db:
        if p["id"] == promo_id:
            if p["status"] == "active":
                p["status"] = "paused"
            elif p["status"] == "paused":
                p["status"] = "active"
            return {"data": p}
    raise HTTPException(status_code=404, detail="Promotion not found")


@app.get("/api/abtests")
async def get_abtests():
    return {"data": abtests_db, "total": len(abtests_db)}


@app.post("/api/abtests")
async def create_abtest(test: ABTestCreate):
    new_test = {
        "id": f"test_{uuid.uuid4().hex[:8]}",
        "name": test.name,
        "description": test.description,
        "status": "running",
        "createdAt": datetime.now().isoformat(),
        "groupAName": test.groupAName,
        "groupBName": test.groupBName,
        "splitRatio": {"A": 50, "B": 50}
    }
    abtests_db.insert(0, new_test)
    return {"data": new_test}


@app.get("/api/abtests/{test_id}/stats")
async def get_abtest_stats(test_id: str):
    for test in abtests_db:
        if test["id"] == test_id:
            delay = random.uniform(0.1, 0.5)
            time.sleep(delay)
            stats = generate_realtime_stats()
            return {"data": stats}
    raise HTTPException(status_code=404, detail="ABTest not found")


@app.get("/api/abtests/{test_id}/history")
async def get_abtest_history(test_id: str):
    for test in abtests_db:
        if test["id"] == test_id:
            history = generate_history_data()
            return {"data": history}
    raise HTTPException(status_code=404, detail="ABTest not found")


@app.get("/api/abtests/{test_id}/export")
async def export_abtest(test_id: str):
    test = None
    for t in abtests_db:
        if t["id"] == test_id:
            test = t
            break
    if not test:
        raise HTTPException(status_code=404, detail="ABTest not found")

    history = generate_history_data()

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "日期",
        "A组转化率", "A组置信区间下限", "A组置信区间上限",
        "B组转化率", "B组置信区间下限", "B组置信区间上限"
    ])

    for record in history:
        writer.writerow([
            record["date"],
            record["groupA"]["conversionRate"],
            record["groupA"]["confidenceLower"],
            record["groupA"]["confidenceUpper"],
            record["groupB"]["conversionRate"],
            record["groupB"]["confidenceLower"],
            record["groupB"]["confidenceUpper"]
        ])

    output.seek(0)
    filename = f"abtest_{test_id}_export.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/groups")
async def get_groups():
    return {"data": groups_db, "total": len(groups_db)}
