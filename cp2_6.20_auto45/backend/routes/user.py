from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import uuid
import json
import os
import time

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, 'users.json')

users_db: Dict[str, dict] = {}


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


def init_users():
    global users_db
    users_db = load_from_file(USERS_FILE, {})
    
    if not users_db:
        default_users = {
            "user-1": {
                "id": "user-1",
                "username": "农场主小明",
                "coins": 500,
                "inventory": {
                    "wheat": 8,
                    "egg": 12,
                    "milk": 5
                },
                "createdAt": int(time.time() * 1000)
            }
        }
        users_db = default_users
        save_to_file(users_db, USERS_FILE)


init_users()


class UserRegister(BaseModel):
    username: str
    initialCoins: Optional[int] = 500


class UserLogin(BaseModel):
    username: str


class UserUpdate(BaseModel):
    coins: Optional[int] = None
    inventory: Optional[Dict[str, int]] = None


class InventoryUpdate(BaseModel):
    item: str
    amount: int
    operation: str = "add"


@router.post("/register")
async def register(data: UserRegister):
    for existing_user in users_db.values():
        if existing_user["username"].lower() == data.username.lower():
            raise HTTPException(status_code=400, detail="该用户名已被注册")
    
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    user = {
        "id": user_id,
        "username": data.username,
        "coins": data.initialCoins or 500,
        "inventory": {},
        "createdAt": int(time.time() * 1000),
        "lastLoginAt": int(time.time() * 1000)
    }
    users_db[user_id] = user
    save_to_file(users_db, USERS_FILE)
    return user


@router.post("/login")
async def login(data: UserLogin):
    for uid, user in users_db.items():
        if user["username"] == data.username:
            user["lastLoginAt"] = int(time.time() * 1000)
            users_db[uid] = user
            save_to_file(users_db, USERS_FILE)
            return user
    
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    user = {
        "id": user_id,
        "username": data.username,
        "coins": 500,
        "inventory": {},
        "createdAt": int(time.time() * 1000),
        "lastLoginAt": int(time.time() * 1000)
    }
    users_db[user_id] = user
    save_to_file(users_db, USERS_FILE)
    return user


@router.get("/{user_id}")
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    return users_db[user_id]


@router.get("/{user_id}/inventory")
async def get_user_inventory(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    user = users_db[user_id]
    return {
        "userId": user_id,
        "username": user["username"],
        "inventory": user.get("inventory", {}),
        "totalItems": sum(user.get("inventory", {}).values())
    }


@router.post("/{user_id}/update")
async def update_user(user_id: str, data: UserUpdate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user = users_db[user_id]
    
    if data.coins is not None:
        user["coins"] = max(0, data.coins)
    
    if data.inventory is not None:
        user["inventory"] = data.inventory
    
    user["updatedAt"] = int(time.time() * 1000)
    users_db[user_id] = user
    save_to_file(users_db, USERS_FILE)
    
    return user


@router.post("/{user_id}/coins")
async def update_coins(user_id: str, amount: int, operation: str = "add"):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user = users_db[user_id]
    
    if operation == "add":
        user["coins"] += amount
    elif operation == "subtract":
        if user["coins"] < amount:
            raise HTTPException(status_code=400, detail="金币不足")
        user["coins"] -= amount
    elif operation == "set":
        user["coins"] = max(0, amount)
    else:
        raise HTTPException(status_code=400, detail="无效的操作类型")
    
    user["updatedAt"] = int(time.time() * 1000)
    users_db[user_id] = user
    save_to_file(users_db, USERS_FILE)
    
    return {
        "userId": user_id,
        "coins": user["coins"],
        "operation": operation,
        "amount": amount
    }


@router.post("/{user_id}/inventory/update")
async def update_inventory(user_id: str, data: InventoryUpdate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user = users_db[user_id]
    inventory = user.get("inventory", {})
    
    current_amount = inventory.get(data.item, 0)
    
    if data.operation == "add":
        inventory[data.item] = current_amount + data.amount
    elif data.operation == "subtract":
        if current_amount < data.amount:
            raise HTTPException(
                status_code=400,
                detail=f"{data.item} 不足，当前数量: {current_amount}"
            )
        inventory[data.item] = current_amount - data.amount
        if inventory[data.item] == 0:
            del inventory[data.item]
    elif data.operation == "set":
        if data.amount <= 0:
            if data.item in inventory:
                del inventory[data.item]
        else:
            inventory[data.item] = data.amount
    else:
        raise HTTPException(status_code=400, detail="无效的操作类型")
    
    user["inventory"] = inventory
    user["updatedAt"] = int(time.time() * 1000)
    users_db[user_id] = user
    save_to_file(users_db, USERS_FILE)
    
    return {
        "userId": user_id,
        "item": data.item,
        "newAmount": inventory.get(data.item, 0),
        "operation": data.operation,
        "inventory": inventory
    }


@router.get("")
async def list_users(limit: int = 20, offset: int = 0):
    users = list(users_db.values())
    users.sort(key=lambda x: x.get("coins", 0), reverse=True)
    return {
        "users": users[offset:offset+limit],
        "total": len(users),
        "limit": limit,
        "offset": offset
    }


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    deleted_user = users_db.pop(user_id)
    save_to_file(users_db, USERS_FILE)
    
    return {
        "message": "用户已删除",
        "userId": user_id,
        "username": deleted_user["username"]
    }
