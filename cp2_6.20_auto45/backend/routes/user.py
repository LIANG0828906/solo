from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import uuid

router = APIRouter()

users_db: Dict[str, dict] = {}


class UserRegister(BaseModel):
    username: str


class UserLogin(BaseModel):
    username: str


class UserResponse(BaseModel):
    id: str
    username: str
    coins: int
    inventory: Dict[str, int]


@router.post("/register", response_model=UserResponse)
async def register(data: UserRegister):
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": data.username,
        "coins": 500,
        "inventory": {}
    }
    users_db[user_id] = user
    return user


@router.post("/login", response_model=UserResponse)
async def login(data: UserLogin):
    for user in users_db.values():
        if user["username"] == data.username:
            return user
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": data.username,
        "coins": 500,
        "inventory": {}
    }
    users_db[user_id] = user
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="用户不存在")
    return users_db[user_id]
