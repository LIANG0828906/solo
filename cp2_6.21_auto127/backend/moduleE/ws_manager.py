from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect
import json


class ConnectionManager:
    def __init__(self):
        self.doc_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, doc_id: int):
        await websocket.accept()
        if doc_id not in self.doc_connections:
            self.doc_connections[doc_id] = []
        self.doc_connections[doc_id].append(websocket)

    def disconnect(self, websocket: WebSocket, doc_id: int):
        if doc_id in self.doc_connections:
            if websocket in self.doc_connections[doc_id]:
                self.doc_connections[doc_id].remove(websocket)
            if not self.doc_connections[doc_id]:
                del self.doc_connections[doc_id]

    async def broadcast_to_doc(self, doc_id: int, message: dict):
        if doc_id not in self.doc_connections:
            return
        disconnected = []
        for connection in self.doc_connections[doc_id]:
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn, doc_id)

    def get_connections_count(self, doc_id: int) -> int:
        if doc_id not in self.doc_connections:
            return 0
        return len(self.doc_connections[doc_id])


manager = ConnectionManager()
