import asyncio
import json
from typing import Dict, List, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}
        self.room_state: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
            self.room_state[room_id] = {
                "drawings": [],
                "notes": [],
            }
        self.rooms[room_id].append(websocket)
        state = self.room_state[room_id]
        await websocket.send_text(json.dumps({
            "type": "init",
            "drawings": state["drawings"],
            "notes": state["notes"],
            "userCount": len(self.rooms[room_id]),
        }))
        await self.broadcast(room_id, {
            "type": "user_count",
            "userCount": len(self.rooms[room_id]),
        }, exclude=websocket)

    async def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            if len(self.rooms[room_id]) == 0:
                del self.rooms[room_id]
                if room_id in self.room_state:
                    del self.room_state[room_id]
            else:
                await self.broadcast(room_id, {
                    "type": "user_count",
                    "userCount": len(self.rooms[room_id]),
                })

    async def broadcast(self, room_id: str, message: Dict[str, Any], exclude: WebSocket = None):
        if room_id not in self.rooms:
            return
        message_str = json.dumps(message)
        for connection in self.rooms[room_id]:
            if connection != exclude:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    pass

    def update_state(self, room_id: str, message: Dict[str, Any]):
        if room_id not in self.room_state:
            return
        state = self.room_state[room_id]
        msg_type = message.get("type")

        if msg_type == "draw":
            state["drawings"].append(message["data"])
        elif msg_type == "draw_batch":
            state["drawings"].extend(message["data"])
        elif msg_type == "add_note":
            state["notes"].append(message["data"])
        elif msg_type == "update_note":
            for i, note in enumerate(state["notes"]):
                if note["id"] == message["data"]["id"]:
                    state["notes"][i] = message["data"]
                    break
        elif msg_type == "delete_note":
            state["notes"] = [n for n in state["notes"] if n["id"] != message["data"]["id"]]
        elif msg_type == "clear":
            state["drawings"] = []
            state["notes"] = []
        elif msg_type == "undo_redo_state":
            state["drawings"] = message["data"]["drawings"]
            state["notes"] = message["data"]["notes"]


manager = RoomManager()


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            manager.update_state(room_id, message)
            await manager.broadcast(room_id, message, exclude=websocket)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id)


@app.get("/")
async def root():
    return {"message": "Collaborative Whiteboard Server"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
