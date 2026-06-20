from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import socketio
from nanoid import generate

from database import Base, engine, get_db
from models import BoardRoom, Creative
from schemas import (
    BoardRoomCreate,
    BoardRoomResponse,
    BoardRoomDetailResponse,
    CreativeCreate,
    CreativeResponse,
)


def utcnow():
    return datetime.now(timezone.utc)


def to_json(model):
    return model.model_dump(mode="json", by_alias=True)


sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
socket_app = socketio.ASGIApp(sio)

app = FastAPI(title="Brainstorm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/socket.io", socket_app)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    rooms = sio.rooms(sid)
    for room in rooms:
        if room != sid:
            await sio.leave_room(sid, room)


@sio.event
async def join_room(sid, room_id):
    await sio.enter_room(sid, room_id)


@sio.event
async def leave_room(sid, room_id):
    await sio.leave_room(sid, room_id)


@sio.event
async def co_create(sid, data):
    room_id = data.get("boardRoomId") or data.get("board_room_id")
    if room_id:
        await sio.emit("co_create", data, room=room_id, skip_sid=sid)


@sio.event
async def co_vote(sid, data):
    room_id = data.get("boardRoomId") or data.get("board_room_id")
    if room_id:
        await sio.emit("co_vote", data, room=room_id, skip_sid=sid)


@sio.event
async def co_delete(sid, data):
    room_id = data.get("boardRoomId") or data.get("board_room_id")
    if room_id:
        await sio.emit("co_delete", data, room=room_id, skip_sid=sid)


@app.get("/api/board-rooms")
async def get_board_rooms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BoardRoom, func.count(Creative.id).label("creative_count"))
        .outerjoin(Creative, Creative.board_room_id == BoardRoom.id)
        .group_by(BoardRoom.id)
        .order_by(BoardRoom.created_at.desc())
    )
    rows = result.all()
    response = []
    for room, count in rows:
        room_data = BoardRoomResponse.model_validate(room)
        room_data.creative_count = count
        response.append(to_json(room_data))
    return JSONResponse(response)


@app.post("/api/board-rooms")
async def create_board_room(
    data: BoardRoomCreate, db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(BoardRoom).where(BoardRoom.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="脑暴室名称已存在")

    room = BoardRoom(
        id=generate(),
        name=data.name,
        description=data.description,
        created_at=utcnow(),
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    resp = BoardRoomResponse.model_validate(room)
    return JSONResponse(to_json(resp))


@app.get("/api/board-rooms/{room_id}")
async def get_board_room(room_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BoardRoom).where(BoardRoom.id == room_id)
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="脑暴室不存在")

    result_creatives = await db.execute(
        select(Creative)
        .where(Creative.board_room_id == room_id)
        .order_by(Creative.created_at.desc())
    )
    creatives = result_creatives.scalars().all()

    detail = BoardRoomDetailResponse(
        id=room.id,
        name=room.name,
        description=room.description,
        created_at=room.created_at,
        creatives=[CreativeResponse.model_validate(c) for c in creatives],
    )
    return JSONResponse(to_json(detail))


@app.post("/api/board-rooms/{room_id}/creatives")
async def create_creative(
    room_id: str, data: CreativeCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BoardRoom).where(BoardRoom.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="脑暴室不存在")

    creative = Creative(
        id=generate(),
        content=data.content,
        type=data.type or "idea",
        author=data.author,
        votes=0,
        voters=[],
        created_at=utcnow(),
        board_room_id=room_id,
        created_by=data.created_by,
    )
    db.add(creative)
    await db.commit()
    await db.refresh(creative)

    resp = CreativeResponse.model_validate(creative)
    emit_data = to_json(resp)
    await sio.emit("co_create", emit_data, room=room_id)

    return JSONResponse(emit_data)


@app.post("/api/board-rooms/{room_id}/creatives/{creative_id}/vote")
async def vote_creative(
    room_id: str,
    creative_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.get("userId") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="缺少userId")

    result = await db.execute(
        select(Creative).where(
            Creative.id == creative_id, Creative.board_room_id == room_id
        )
    )
    creative = result.scalar_one_or_none()
    if not creative:
        raise HTTPException(status_code=404, detail="创意不存在")

    if user_id in creative.voters:
        creative.voters = [v for v in creative.voters if v != user_id]
        creative.votes = creative.votes - 1
    else:
        creative.voters = creative.voters + [user_id]
        creative.votes = creative.votes + 1
    await db.commit()
    await db.refresh(creative)

    resp = CreativeResponse.model_validate(creative)
    emit_data = to_json(resp)
    await sio.emit("co_vote", emit_data, room=room_id)

    return JSONResponse(emit_data)


@app.delete("/api/board-rooms/{room_id}/creatives/{creative_id}")
async def delete_creative(
    room_id: str,
    creative_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.get("userId") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="缺少userId")

    result = await db.execute(
        select(Creative).where(
            Creative.id == creative_id, Creative.board_room_id == room_id
        )
    )
    creative = result.scalar_one_or_none()
    if not creative:
        raise HTTPException(status_code=404, detail="创意不存在")

    if creative.created_by != user_id:
        raise HTTPException(status_code=403, detail="只有作者可以删除此创意")

    now = utcnow()
    if now - creative.created_at > timedelta(minutes=10):
        raise HTTPException(status_code=403, detail="超过10分钟无法删除")

    await db.delete(creative)
    await db.commit()

    emit_data = {"creativeId": creative_id, "boardRoomId": room_id}
    await sio.emit("co_delete", emit_data, room=room_id)

    return {"success": True, "id": creative_id}
