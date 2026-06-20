from typing import Dict, List, Optional
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.connection_rooms: Dict[int, str] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        self.connection_rooms[id(websocket)] = room_id

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        ws_id = id(websocket)
        if ws_id in self.connection_rooms:
            del self.connection_rooms[ws_id]

    async def broadcast(self, room_id: str, message: dict):
        if room_id not in self.active_connections:
            return
        stale: List[WebSocket] = []
        for connection in self.active_connections[room_id]:
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)
        for conn in stale:
            self.disconnect(room_id, conn)

    def get_room_connections(self, room_id: str) -> int:
        return len(self.active_connections.get(room_id, []))

    def get_all_room_ids(self) -> List[str]:
        return list(self.active_connections.keys())

    def get_total_connections(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())


manager = ConnectionManager()
