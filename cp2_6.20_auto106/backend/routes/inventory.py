from fastapi import APIRouter, HTTPException, Query
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from backend.models import Consumable, StockRecord, StockCheckRequest, consumables_db, records_db

router = APIRouter()


def calculate_safety_threshold(consumable_id: str, purchase_cycle: int) -> int:
    now = datetime.now().date()
    thirty_days_ago = now - timedelta(days=30)

    out_records = [
        r for r in records_db
        if r.consumableId == consumable_id
        and r.type == "out"
        and datetime.fromisoformat(r.timestamp).date() >= thirty_days_ago
    ]

    total_out = sum(r.quantity for r in out_records)
    daily_consumption = total_out / 30 if total_out > 0 else 0

    if daily_consumption == 0:
        for c in consumables_db.values():
            if c.id == consumable_id:
                daily_consumption = c.dailyConsumption
                break

    safety_threshold = round(daily_consumption * purchase_cycle * 1.5)
    return max(1, safety_threshold)


@router.get("", response_model=List[Consumable])
async def get_inventory():
    result = []
    for c in consumables_db.values():
        safety_threshold = calculate_safety_threshold(c.id, c.purchaseCycle)
        updated = c.model_copy(update={
            "safetyThreshold": safety_threshold
        })
        result.append(updated)
    return result


@router.get("/{consumable_id}", response_model=Consumable)
async def get_consumable(consumable_id: str):
    if consumable_id not in consumables_db:
        raise HTTPException(status_code=404, detail="Consumable not found")
    c = consumables_db[consumable_id]
    safety_threshold = calculate_safety_threshold(c.id, c.purchaseCycle)
    return c.model_copy(update={"safetyThreshold": safety_threshold})


@router.post("/check")
async def check_stock(request: StockCheckRequest):
    if request.consumableId not in consumables_db:
        raise HTTPException(status_code=404, detail="Consumable not found")

    consumable = consumables_db[request.consumableId]
    now = datetime.now().isoformat()

    if request.type == "in":
        consumable.currentStock += request.quantity
    elif request.type == "out":
        if request.quantity > consumable.currentStock:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        consumable.currentStock -= request.quantity
    elif request.type == "check":
        consumable.lastCheckTime = now
        return {"message": "Stock checked successfully", "consumable": consumable}
    else:
        raise HTTPException(status_code=400, detail="Invalid operation type")

    if request.type in ["in", "out"]:
        record = StockRecord(
            id=str(uuid.uuid4()),
            consumableId=request.consumableId,
            consumableName=consumable.name,
            type=request.type,
            quantity=request.quantity,
            timestamp=now,
            operator="管理员",
            remark=request.remark or "",
        )
        records_db.insert(0, record)

    safety_threshold = calculate_safety_threshold(consumable.id, consumable.purchaseCycle)
    consumable.safetyThreshold = safety_threshold
    consumable.lastCheckTime = now
    consumables_db[request.consumableId] = consumable

    return {"message": "Stock updated successfully", "consumable": consumable}


@router.get("/records", response_model=List[StockRecord])
async def get_records(
    limit: Optional[int] = Query(None, description="Number of records to return"),
    consumable_id: Optional[str] = Query(None, description="Filter by consumable ID"),
):
    filtered = records_db
    if consumable_id:
        filtered = [r for r in filtered if r.consumableId == consumable_id]
    if limit:
        filtered = filtered[:limit]
    return filtered


@router.get("/trends")
async def get_trends(
    consumableId: Optional[str] = Query(None, description="Filter by consumable ID"),
    days: int = Query(30, description="Number of days to analyze"),
):
    now = datetime.now().date()
    trends = []

    for i in range(days - 1, -1, -1):
        date = now - timedelta(days=i)
        date_str = date.strftime("%m-%d")

        day_records = [
            r for r in records_db
            if datetime.fromisoformat(r.timestamp).date() == date
            and (consumableId is None or r.consumableId == consumableId)
        ]

        in_count = sum(r.quantity for r in day_records if r.type == "in")
        out_count = sum(r.quantity for r in day_records if r.type == "out")

        trends.append({
            "date": date_str,
            "inCount": in_count,
            "outCount": out_count,
        })

    return trends
