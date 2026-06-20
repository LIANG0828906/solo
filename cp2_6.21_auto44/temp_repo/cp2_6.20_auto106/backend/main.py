from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uuid
import random
from datetime import datetime, timedelta
import asyncio

from backend.models import Consumable, StockRecord, consumables_db, records_db
from backend.routes.inventory import router as inventory_router
from backend.routes.ws import router as ws_router, check_alerts_task

app = FastAPI(title="实验室耗材库存管理API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_mock_data():
    consumable_data = [
        ("CON-001", "玻璃试管", "个", "玻璃器皿", 15, 7),
        ("CON-002", "移液枪头(1000ul)", "盒", "移液耗材", 8, 3),
        ("CON-003", "培养皿(90mm)", "个", "细胞培养", 20, 5),
        ("CON-004", "试剂瓶(500ml)", "个", "容器", 12, 4),
        ("CON-005", "离心管(15ml)", "包", "离心耗材", 10, 3),
        ("CON-006", "一次性手套", "盒", "防护用品", 25, 7),
        ("CON-007", "PCR管(0.2ml)", "包", "分子生物学", 6, 2),
        ("CON-008", "滤膜(0.22um)", "盒", "过滤耗材", 8, 3),
    ]

    now = datetime.now()

    for code, name, unit, category, daily_consumption, purchase_cycle in consumable_data:
        cid = str(uuid.uuid4())
        base_stock = int(daily_consumption * purchase_cycle * 2.5)
        safety_threshold = round(daily_consumption * purchase_cycle * 1.5)
        current_stock = random.randint(int(safety_threshold * 0.3), base_stock)

        consumable = Consumable(
            id=cid,
            code=code,
            name=name,
            currentStock=current_stock,
            safetyThreshold=safety_threshold,
            unit=unit,
            category=category,
            lastCheckTime=(now - timedelta(days=random.randint(0, 7))).isoformat(),
            purchaseCycle=purchase_cycle,
            dailyConsumption=float(daily_consumption),
        )
        consumables_db[cid] = consumable

    for _ in range(50):
        cid = random.choice(list(consumables_db.keys()))
        c = consumables_db[cid]
        record_type = random.choice(["in", "out"])
        days_ago = random.randint(0, 29)
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)

        record = StockRecord(
            id=str(uuid.uuid4()),
            consumableId=cid,
            consumableName=c.name,
            type=record_type,
            quantity=random.randint(1, 20),
            timestamp=(now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)).isoformat(),
            operator="管理员",
            remark=random.choice(["", "日常采购", "实验使用", "盘点调整"]),
        )
        records_db.append(record)

    records_db.sort(key=lambda x: x.timestamp, reverse=True)


@app.on_event("startup")
async def startup_event():
    generate_mock_data()
    asyncio.create_task(check_alerts_task())


@app.get("/dashboard/stats")
async def get_dashboard_stats():
    from backend.routes.inventory import calculate_safety_threshold

    now = datetime.now().date()
    today_in = sum(r.quantity for r in records_db if r.type == "in" and datetime.fromisoformat(r.timestamp).date() == now)
    today_out = sum(r.quantity for r in records_db if r.type == "out" and datetime.fromisoformat(r.timestamp).date() == now)
    total_stock = sum(c.currentStock for c in consumables_db.values())

    low_alert = 0
    for c in consumables_db.values():
        safety_threshold = calculate_safety_threshold(c.id, c.purchaseCycle)
        if c.currentStock < safety_threshold:
            low_alert += 1

    return {
        "totalStock": total_stock,
        "lowAlertCount": low_alert,
        "todayInCount": today_in,
        "todayOutCount": today_out,
    }


app.include_router(inventory_router, prefix="/inventory", tags=["inventory"])
app.include_router(ws_router, prefix="/ws", tags=["websocket"])


@app.get("/")
async def root():
    return {"message": "实验室耗材库存管理系统 API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
