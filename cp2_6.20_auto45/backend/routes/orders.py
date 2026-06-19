from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import time

router = APIRouter()

orders_db: Dict[str, dict] = {}
contributions_db: Dict[str, dict] = {}


def init_data():
    orders_db["o1"] = {
        "id": "o1",
        "name": "收集鸡蛋",
        "icon": "🥚",
        "targetItem": "egg",
        "targetAmount": 50,
        "currentAmount": 12,
        "reward": 200,
        "completed": False,
        "completedAt": None
    }
    orders_db["o2"] = {
        "id": "o2",
        "name": "收获小麦",
        "icon": "🌾",
        "targetItem": "wheat",
        "targetAmount": 30,
        "currentAmount": 8,
        "reward": 150,
        "completed": False,
        "completedAt": None
    }
    orders_db["o3"] = {
        "id": "o3",
        "name": "收集牛奶",
        "icon": "🥛",
        "targetItem": "milk",
        "targetAmount": 20,
        "currentAmount": 20,
        "reward": 180,
        "completed": True,
        "completedAt": int(time.time() * 1000) - 300000
    }
    
    contributions_db["c1"] = {
        "id": "c1",
        "username": "农场主小明",
        "count": 15,
        "points": 450
    }
    contributions_db["c2"] = {
        "id": "c2",
        "username": "勤劳的小红",
        "count": 12,
        "points": 380
    }
    contributions_db["c3"] = {
        "id": "c3",
        "username": "快乐农夫",
        "count": 8,
        "points": 240
    }
    contributions_db["c4"] = {
        "id": "c4",
        "username": "新手小白",
        "count": 3,
        "points": 90
    }


init_data()


class SubmitOrderRequest(BaseModel):
    amount: int


@router.get("/orders")
async def get_orders():
    return list(orders_db.values())


@router.post("/orders/{order_id}/submit")
async def submit_order(order_id: str, data: SubmitOrderRequest):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    if order["completed"]:
        raise HTTPException(status_code=400, detail="订单已完成")
    
    new_amount = min(order["targetAmount"], order["currentAmount"] + data.amount)
    order["currentAmount"] = new_amount
    
    if new_amount >= order["targetAmount"]:
        order["completed"] = True
        order["completedAt"] = int(time.time() * 1000)
    
    return order


@router.get("/coop/contributions")
async def get_contributions():
    contributions = list(contributions_db.values())
    contributions.sort(key=lambda x: x["points"], reverse=True)
    return contributions
