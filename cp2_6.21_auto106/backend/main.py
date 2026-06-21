from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

from database import db

app = FastAPI(title="个人书库管理系统 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BookCreate(BaseModel):
    title: str
    author: str
    tags: List[str]
    cover_url: str
    status: str = "available"
    rating: float = 0
    description: str = ""


class BookStatusUpdate(BaseModel):
    status: str
    borrower: Optional[str] = None


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast(self, message: dict, exclude_user_id: Optional[int] = None):
        disconnected = []
        for user_id, connections in list(self.active_connections.items()):
            if user_id == exclude_user_id:
                continue
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append((user_id, connection))
        for user_id, connection in disconnected:
            if user_id in self.active_connections and connection in self.active_connections[user_id]:
                self.active_connections[user_id].remove(connection)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]

    async def broadcast_to_all(self, message: dict):
        await self.broadcast(message, exclude_user_id=None)


manager = ConnectionManager()


@app.get("/api/books")
async def get_books(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    return db.get_books(page, page_size)


@app.post("/api/books")
async def create_book(book: BookCreate):
    result = db.add_book(book.dict())
    return result


@app.put("/api/books/{book_id}/status")
async def update_book_status(book_id: int, update: BookStatusUpdate):
    if update.status not in ["available", "borrowed"]:
        raise HTTPException(status_code=400, detail="状态必须是 available 或 borrowed")

    if update.status == "borrowed" and not update.borrower:
        raise HTTPException(status_code=400, detail="借出时必须指定借阅人")

    result = db.update_book_status(book_id, update.status, update.borrower)
    if not result:
        raise HTTPException(status_code=404, detail="书籍不存在")

    ws_message = {
        "type": "borrow" if update.status == "borrowed" else "return",
        "user": update.borrower or "系统",
        "book_id": book_id,
        "book_title": result["title"],
        "timestamp": result.get("created_at", "")
    }
    await manager.broadcast_to_all(ws_message)

    return result


@app.get("/api/statistics")
async def get_statistics():
    return db.get_statistics()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await manager.broadcast(message, exclude_user_id=user_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
