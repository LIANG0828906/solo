from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import time
import json
import os
import uuid

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

ORDERS_FILE = os.path.join(DATA_DIR, 'orders.json')
CONTRIBUTIONS_FILE = os.path.join(DATA_DIR, 'contributions.json')

orders_db: Dict[str, dict] = {}
contributions_db: Dict[str, dict] = {}


def save_to_file(data: dict, filepath: str):
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存数据失败: {e}")


def load_from_file(filepath: str, default: dict) -> dict:
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"加载数据失败: {e}")
    return default


def init_data():
    global orders_db, contributions_db

    orders_db = load_from_file(ORDERS_FILE, {})
    contributions_db = load_from_file(CONTRIBUTIONS_FILE, {})

    if not orders_db:
        now = int(time.time() * 1000)
        orders_db = {
            "o1": {
                "id": "o1",
                "name": "收集鸡蛋",
                "icon": "🥚",
                "targetItem": "egg",
                "targetAmount": 50,
                "currentAmount": 12,
                "reward": 200,
                "completed": False,
                "completedAt": None
            },
            "o2": {
                "id": "o2",
                "name": "收获小麦",
                "icon": "🌾",
                "targetItem": "wheat",
                "targetAmount": 30,
                "currentAmount": 8,
                "reward": 150,
                "completed": False,
                "completedAt": None
            },
            "o3": {
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
        }
        save_to_file(orders_db, ORDERS_FILE)

    if not contributions_db:
        contributions_db = {
            "c1": {
                "id": "c1",
                "username": "农场主小明",
                "count": 15,
                "points": 450
            },
            "c2": {
                "id": "c2",
                "username": "勤劳的小红",
                "count": 12,
                "points": 380
            },
            "c3": {
                "id": "c3",
                "username": "快乐农夫",
                "count": 8,
                "points": 240
            },
            "c4": {
                "id": "c4",
                "username": "新手小白",
                "count": 3,
                "points": 90
            }
        }
        save_to_file(contributions_db, CONTRIBUTIONS_FILE)


init_data()


class SubmitOrderRequest(BaseModel):
    amount: int
    userId: Optional[str] = None
    username: Optional[str] = None


class CreateOrderRequest(BaseModel):
    name: str
    icon: str
    targetItem: str
    targetAmount: int
    reward: int


class UpdateContributionRequest(BaseModel):
    username: str
    points: int
    countIncrement: Optional[int] = 1


@router.get("/orders")
async def get_orders():
    orders_list = list(orders_db.values())
    orders_list.sort(key=lambda x: (x["completed"], -x["reward"]))
    return orders_list


@router.get("/orders/{order_id}")
async def get_order(order_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    return orders_db[order_id]


@router.post("/orders/create")
async def create_order(data: CreateOrderRequest):
    order_id = f"order-{uuid.uuid4().hex[:8]}"
    order = {
        "id": order_id,
        "name": data.name,
        "icon": data.icon,
        "targetItem": data.targetItem,
        "targetAmount": data.targetAmount,
        "currentAmount": 0,
        "reward": data.reward,
        "completed": False,
        "completedAt": None,
        "createdAt": int(time.time() * 1000)
    }
    orders_db[order_id] = order
    save_to_file(orders_db, ORDERS_FILE)
    return order


@router.post("/orders/{order_id}/submit")
async def submit_order(order_id: str, data: SubmitOrderRequest):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    
    if order["completed"]:
        raise HTTPException(status_code=400, detail="订单已完成，无法再次提交")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="提交数量必须大于0")
    
    new_amount = min(order["targetAmount"], order["currentAmount"] + data.amount)
    was_completed = new_amount >= order["targetAmount"]
    
    order["currentAmount"] = new_amount
    
    if was_completed and not order["completed"]:
        order["completed"] = True
        order["completedAt"] = int(time.time() * 1000)
        
        if data.username:
            update_contribution_for_user(data.username, 50, 1)
    
    orders_db[order_id] = order
    save_to_file(orders_db, ORDERS_FILE)
    
    response = order.copy()
    if was_completed:
        response["rewardEarned"] = order["reward"]
        response["contributionAdded"] = True
    
    return response


def update_contribution_for_user(username: str, points: int, count: int = 1):
    contribution_found = None
    
    for cid, contrib in contributions_db.items():
        if contrib["username"] == username:
            contribution_found = cid
            break
    
    if contribution_found:
        contributions_db[contribution_found]["points"] += points
        contributions_db[contribution_found]["count"] += count
        contributions_db[contribution_found]["lastUpdated"] = int(time.time() * 1000)
    else:
        new_id = f"contrib-{uuid.uuid4().hex[:8]}"
        contributions_db[new_id] = {
            "id": new_id,
            "username": username,
            "count": count,
            "points": points,
            "lastUpdated": int(time.time() * 1000)
        }
    
    save_to_file(contributions_db, CONTRIBUTIONS_FILE)


@router.get("/coop/contributions")
async def get_contributions(sort_by: str = "points"):
    contributions = list(contributions_db.values())
    
    if sort_by == "points":
        contributions.sort(key=lambda x: x.get("points", 0), reverse=True)
    elif sort_by == "count":
        contributions.sort(key=lambda x: x.get("count", 0), reverse=True)
    
    return contributions


@router.post("/coop/contributions/update")
async def update_contribution(data: UpdateContributionRequest):
    update_contribution_for_user(data.username, data.points, data.countIncrement)
    
    contributions = list(contributions_db.values())
    contributions.sort(key=lambda x: x.get("points", 0), reverse=True)
    return contributions


@router.get("/coop/leaderboard")
async def get_leaderboard(limit: int = 10, sort_by: str = "points"):
    contributions = list(contributions_db.values())
    
    if sort_by == "points":
        contributions.sort(key=lambda x: x.get("points", 0), reverse=True)
    elif sort_by == "count":
        contributions.sort(key=lambda x: x.get("count", 0), reverse=True)
    
    total_points = sum(c.get("points", 0) for c in contributions)
    total_count = sum(c.get("count", 0) for c in contributions)
    completed_orders = sum(1 for o in orders_db.values() if o["completed"])
    
    return {
        "leaderboard": contributions[:limit],
        "totalPlayers": len(contributions),
        "totalPoints": total_points,
        "totalContributions": total_count,
        "completedOrders": completed_orders
    }


@router.get("/stats/summary")
async def get_stats_summary():
    orders = list(orders_db.values())
    contributions = list(contributions_db.values())
    
    return {
        "totalOrders": len(orders),
        "completedOrders": sum(1 for o in orders if o["completed"]),
        "pendingOrders": sum(1 for o in orders if not o["completed"]),
        "totalRewards": sum(o["reward"] for o in orders if o["completed"]),
        "totalPlayers": len(contributions),
        "totalContributions": sum(c.get("count", 0) for c in contributions),
        "totalPoints": sum(c.get("points", 0) for c in contributions),
        "topPlayer": max(contributions, key=lambda x: x.get("points", 0)) if contributions else None,
        "mostActivePlayer": max(contributions, key=lambda x: x.get("count", 0)) if contributions else None
    }
