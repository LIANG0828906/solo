from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn
import random
import uuid
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from models import (
    User, Pet, Gift, GiftItem, Achievement, LeaderboardEntry,
    AdoptRequest, BuyGiftRequest, GardenEvent, MoveRequest, SendGiftRequest,
    PetType, PetColor, Position
)

app = FastAPI(title="萌宠花园 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
socket_app = socketio.ASGIApp(sio, app)

users: Dict[str, User] = {}
garden_pets: Dict[str, Pet] = {}
active_connections: Dict[str, str] = {}

GIFTS: List[Gift] = [
    Gift(id="g1", name="小花朵", icon="🌸", price=5, description="一朵可爱的小花"),
    Gift(id="g2", name="小鱼干", icon="🐟", price=8, description="猫咪最爱的零食"),
    Gift(id="g3", name="毛线球", icon="🧶", price=10, description="可以玩一整天的玩具"),
    Gift(id="g4", name="星星瓶", icon="⭐", price=15, description="装满星星的许愿瓶"),
    Gift(id="g5", name="彩虹糖", icon="🍬", price=6, description="七彩甜蜜糖果"),
    Gift(id="g6", name="小蛋糕", icon="🎂", price=12, description="美味的迷你蛋糕"),
    Gift(id="g7", name="蝴蝶结", icon="🎀", price=9, description="漂亮的蝴蝶结装饰"),
    Gift(id="g8", name="爱心气球", icon="🎈", price=7, description="充满爱意的气球"),
]

DEFAULT_ACHIEVEMENTS: List[Achievement] = [
    Achievement(id="a1", name="贴心主人", description="连续照顾7天", icon="💝", condition="连续登录7天", unlocked=False),
    Achievement(id="a2", name="慷慨好友", description="送出100次礼物", icon="🎁", condition="送出100份礼物", unlocked=False),
    Achievement(id="a3", name="快乐达人", description="宠物最高快乐度达到90", icon="✨", condition="宠物快乐度≥90", unlocked=False),
    Achievement(id="a4", name="社交蝴蝶", description="花园互动50次", icon="🦋", condition="花园互动50次", unlocked=False),
    Achievement(id="a5", name="收藏家", description="收集全部种类礼物", icon="📦", condition="拥有全部8种礼物", unlocked=False),
    Achievement(id="a6", name="园丁大师", description="在花园累计1小时", icon="🌳", condition="花园累计1小时", unlocked=False),
]

RANDOM_NAMES = ["小太阳", "月亮姐姐", "星星控", "糖果屋", "云朵朵", "彩虹糖", "小花园", "蜜蜂侠", "薄荷糖", "棉花糖"]
RANDOM_AVATARS = ["🌞", "🌙", "⭐", "🍬", "☁️", "🌈", "🌷", "🐝", "🍃", "🌸"]


def get_or_create_user(user_id: str) -> User:
    if user_id not in users:
        name = random.choice(RANDOM_NAMES)
        avatar = random.choice(RANDOM_AVATARS)
        users[user_id] = User(
            id=user_id,
            name=name,
            avatar=avatar,
            achievements=[a.model_copy() for a in DEFAULT_ACHIEVEMENTS],
        )
    return users[user_id]


def clamp_stat(value: float) -> float:
    return max(0.0, min(100.0, value))


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    user = get_or_create_user(user_id)
    if user.pet:
        now = time.time()
        elapsed = now - user.pet.last_update
        if elapsed > 0:
            cycles = int(elapsed / 30)
            if cycles > 0:
                user.pet.hunger = clamp_stat(user.pet.hunger - cycles * 2)
                user.pet.happiness = clamp_stat(user.pet.happiness - cycles * 3)
                user.pet.energy = clamp_stat(user.pet.energy - cycles * 1)
                user.pet.last_update = now
                user.max_happiness = max(user.max_happiness, int(user.pet.happiness))
    return user


@app.post("/api/users/{user_id}/pet")
async def adopt_pet(user_id: str, req: AdoptRequest):
    user = get_or_create_user(user_id)
    if user.pet:
        raise HTTPException(status_code=400, detail="你已经有宠物了")

    pet_id = str(uuid.uuid4())
    pet = Pet(
        id=pet_id,
        name=req.name,
        type=req.type,
        color=req.color,
        owner_id=user_id,
        owner_name=user.name,
    )
    user.pet = pet
    garden_pets[pet_id] = pet
    return user


@app.post("/api/users/{user_id}/pet/feed")
async def feed_pet(user_id: str):
    user = get_or_create_user(user_id)
    if not user.pet:
        raise HTTPException(status_code=404, detail="没有宠物")
    gained = random.randint(10, 15)
    user.pet.hunger = clamp_stat(user.pet.hunger + gained)
    user.pet.last_update = time.time()
    user.max_happiness = max(user.max_happiness, int(user.pet.happiness))
    await broadcast_pet_update(user.pet)
    return {"gained": gained}


@app.post("/api/users/{user_id}/pet/play")
async def play_pet(user_id: str):
    user = get_or_create_user(user_id)
    if not user.pet:
        raise HTTPException(status_code=404, detail="没有宠物")
    gained = random.randint(10, 15)
    user.pet.happiness = clamp_stat(user.pet.happiness + gained)
    user.pet.energy = clamp_stat(user.pet.energy - 2)
    user.pet.last_update = time.time()
    user.max_happiness = max(user.max_happiness, int(user.pet.happiness))
    if user.max_happiness >= 90:
        for ach in user.achievements:
            if ach.id == "a3":
                ach.unlocked = True
    await broadcast_pet_update(user.pet)
    return {"gained": gained}


@app.post("/api/users/{user_id}/pet/clean")
async def clean_pet(user_id: str):
    user = get_or_create_user(user_id)
    if not user.pet:
        raise HTTPException(status_code=404, detail="没有宠物")
    gained = random.randint(10, 15)
    user.pet.energy = clamp_stat(user.pet.energy + gained)
    user.pet.happiness = clamp_stat(user.pet.happiness + 3)
    user.pet.last_update = time.time()
    user.max_happiness = max(user.max_happiness, int(user.pet.happiness))
    await broadcast_pet_update(user.pet)
    return {"gained": gained}


@app.post("/api/users/{user_id}/daily")
async def claim_daily(user_id: str):
    user = get_or_create_user(user_id)
    if user.daily_claimed:
        raise HTTPException(status_code=400, detail="今天已领取")
    user.coins += 20
    user.daily_claimed = True
    today = datetime.now().date()
    last_login = datetime.fromisoformat(user.last_login).date()
    if today - last_login == timedelta(days=1):
        user.consecutive_days += 1
    elif today != last_login:
        user.consecutive_days = 1
    if user.consecutive_days >= 7:
        for ach in user.achievements:
            if ach.id == "a1":
                ach.unlocked = True
    user.last_login = datetime.now().isoformat()
    return user


@app.get("/api/gifts")
async def get_gifts():
    return GIFTS


@app.post("/api/users/{user_id}/inventory")
async def buy_gift(user_id: str, req: BuyGiftRequest):
    user = get_or_create_user(user_id)
    gift = next((g for g in GIFTS if g.id == req.gift_id), None)
    if not gift:
        raise HTTPException(status_code=404, detail="礼物不存在")
    if user.coins < gift.price:
        raise HTTPException(status_code=400, detail="金币不足")
    user.coins -= gift.price
    existing = next((i for i in user.inventory if i.gift_id == req.gift_id), None)
    if existing:
        existing.quantity += 1
    else:
        user.inventory.append(GiftItem(gift_id=req.gift_id, quantity=1))
    unique_gifts = len([i for i in user.inventory if i.quantity > 0])
    if unique_gifts >= 8:
        for ach in user.achievements:
            if ach.id == "a5":
                ach.unlocked = True
    return user


@app.get("/api/leaderboard")
async def get_leaderboard():
    entries: List[LeaderboardEntry] = []
    all_users = sorted(
        users.values(),
        key=lambda u: u.pet.happiness if u.pet else 0,
        reverse=True,
    )
    for rank, user in enumerate(all_users[:20], start=1):
        if user.pet:
            entries.append(LeaderboardEntry(
                user_id=user.id,
                user_name=user.name,
                avatar=user.avatar,
                pet_name=user.pet.name,
                total_happiness=int(user.pet.happiness),
                rank=rank,
            ))
    for _ in range(max(0, 8 - len(entries))):
        rank = len(entries) + 1
        entries.append(LeaderboardEntry(
            user_id=f"mock_{rank}",
            user_name=random.choice(RANDOM_NAMES),
            avatar=random.choice(RANDOM_AVATARS),
            pet_name=random.choice(["毛毛", "豆豆", "球球", "咪咪", "汪汪", "小龙", "花花", "糖糖"]),
            total_happiness=random.randint(60, 95),
            rank=rank,
        ))
    return entries


async def broadcast_pet_update(pet: Pet):
    msg = {"type": "pet_update", "payload": pet.model_dump()}
    await sio.emit("message", msg)


async def broadcast_event(event: GardenEvent):
    msg = {"type": "garden_event", "payload": event.model_dump()}
    await sio.emit("message", msg)


@sio.event
async def connect(sid, environ):
    query = environ.get("QUERY_STRING", "")
    user_id = None
    for part in query.split("&"):
        if part.startswith("userId="):
            user_id = part.split("=")[1]
            break
    if user_id:
        active_connections[sid] = user_id
        user = get_or_create_user(user_id)
        if user.pet:
            user.pet.is_online = True
            garden_pets[user.pet.id] = user.pet
            for existing_sid, existing_uid in active_connections.items():
                if existing_sid != sid:
                    await sio.emit(
                        "message",
                        {"type": "user_joined", "payload": user.pet.model_dump()},
                        to=existing_sid,
                    )


@sio.event
async def disconnect(sid):
    user_id = active_connections.pop(sid, None)
    if user_id:
        user = users.get(user_id)
        if user and user.pet:
            user.pet.is_online = False
            garden_pets.pop(user.pet.id, None)
            await sio.emit(
                "message",
                {"type": "user_left", "payload": user.pet.id},
            )


@sio.event
async def join_garden(sid, data):
    user_id = active_connections.get(sid)
    if not user_id:
        return
    user = get_or_create_user(user_id)
    if user.pet:
        garden_pets[user.pet.id] = user.pet
        other_pets = [
            p.model_dump() for p in garden_pets.values()
            if p.id != user.pet.id
        ]
        await sio.emit(
            "message",
            {"type": "garden_pets", "payload": other_pets},
            to=sid,
        )


@sio.event
async def leave_garden(sid, data):
    pass


@sio.event
async def move(sid, data):
    user_id = active_connections.get(sid)
    if not user_id:
        return
    user = get_or_create_user(user_id)
    if not user.pet:
        return
    pet_id = data.get("pet_id")
    pos = data.get("position", {})
    if pet_id != user.pet.id:
        return
    user.pet.position = Position(x=pos.get("x", 0), y=pos.get("y", 0))
    garden_pets[user.pet.id] = user.pet
    await sio.emit(
        "message",
        {"type": "pet_moved", "payload": user.pet.model_dump()},
    )


@sio.event
async def garden_event(sid, data):
    user_id = active_connections.get(sid)
    if not user_id:
        return
    event = GardenEvent(
        id=str(uuid.uuid4()),
        type=data.get("type", "wave"),
        from_pet_id=data.get("from_pet_id", ""),
        to_pet_id=data.get("to_pet_id"),
        gift_id=data.get("gift_id"),
        timestamp=time.time(),
    )
    await broadcast_event(event)


@sio.event
async def send_gift(sid, data):
    user_id = active_connections.get(sid)
    if not user_id:
        return
    user = get_or_create_user(user_id)
    if not user.pet:
        return
    from_pet_id = data.get("from_pet_id")
    to_pet_id = data.get("to_pet_id")
    gift_id = data.get("gift_id")
    item = next((i for i in user.inventory if i.gift_id == gift_id), None)
    if not item or item.quantity <= 0:
        return
    item.quantity -= 1
    user.gifts_sent += 1
    if user.gifts_sent >= 100:
        for ach in user.achievements:
            if ach.id == "a2":
                ach.unlocked = True
    event = GardenEvent(
        id=str(uuid.uuid4()),
        type="gift",
        from_pet_id=from_pet_id,
        to_pet_id=to_pet_id,
        gift_id=gift_id,
        timestamp=time.time(),
    )
    await broadcast_event(event)
    await sio.emit(
        "message",
        {"type": "gift_received", "payload": {"from": user.name, "gift_id": gift_id}},
    )


if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
