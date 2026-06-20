import asyncio
from typing import Dict, List, Set
import socketio
import time
import uuid


class SocketManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode="asgi",
            cors_allowed_origins="*",
            ping_timeout=60,
            ping_interval=25,
        )
        self.rooms: Dict[str, Set[str]] = {}
        self.user_rooms: Dict[str, str] = {}
        self.user_names: Dict[str, str] = {}
        self.message_rate_limit: Dict[str, List[float]] = {}
        self.MAX_MESSAGES_PER_SECOND = 30
        self.WINDOW_SECONDS = 1

    def get_sio(self):
        return self.sio

    def _check_rate_limit(self, user_id: str) -> bool:
        now = time.time()
        if user_id not in self.message_rate_limit:
            self.message_rate_limit[user_id] = []

        timestamps = self.message_rate_limit[user_id]
        timestamps = [t for t in timestamps if now - t < self.WINDOW_SECONDS]
        self.message_rate_limit[user_id] = timestamps

        if len(timestamps) >= self.MAX_MESSAGES_PER_SECOND:
            return False

        timestamps.append(now)
        return True

    async def connect(self, sid: str, environ: dict):
        query_string = environ.get("QUERY_STRING", "")
        params = {}
        if query_string:
            for pair in query_string.split("&"):
                if "=" in pair:
                    key, value = pair.split("=", 1)
                    params[key] = value

        user_id = params.get("userId", "")
        mindmap_id = params.get("mindmapId", "")

        if not user_id or not mindmap_id:
            await self.sio.disconnect(sid)
            return

        self.user_rooms[sid] = mindmap_id
        self.user_names[sid] = user_id

        if mindmap_id not in self.rooms:
            self.rooms[mindmap_id] = set()
        self.rooms[mindmap_id].add(sid)

        await self.sio.enter_room(sid, mindmap_id)

        user_count = len(self.rooms.get(mindmap_id, set()))
        await self.sio.emit(
            "message",
            {
                "type": "user:join",
                "userId": user_id,
                "mindmapId": mindmap_id,
                "data": {"userCount": user_count},
                "timestamp": time.time(),
                "messageId": str(uuid.uuid4()),
            },
            room=mindmap_id,
        )

    async def disconnect(self, sid: str):
        mindmap_id = self.user_rooms.get(sid)
        user_id = self.user_names.get(sid)

        if mindmap_id and sid in self.rooms.get(mindmap_id, set()):
            self.rooms[mindmap_id].discard(sid)
            if len(self.rooms[mindmap_id]) == 0:
                del self.rooms[mindmap_id]

        if sid in self.user_rooms:
            del self.user_rooms[sid]
        if sid in self.user_names:
            del self.user_names[sid]

        if mindmap_id and user_id:
            user_count = len(self.rooms.get(mindmap_id, set()))
            await self.sio.emit(
                "message",
                {
                    "type": "user:leave",
                    "userId": user_id,
                    "mindmapId": mindmap_id,
                    "data": {"userCount": user_count},
                    "timestamp": time.time(),
                    "messageId": str(uuid.uuid4()),
                },
                room=mindmap_id,
            )

    async def handle_message(self, sid: str, message: dict):
        user_id = self.user_names.get(sid, "")
        mindmap_id = self.user_rooms.get(sid, "")

        if not user_id or not mindmap_id:
            return

        if not self._check_rate_limit(sid):
            await self.sio.emit(
                "ack",
                (message.get("messageId", ""), False, "Rate limit exceeded"),
                to=sid,
            )
            return

        message_type = message.get("type", "")
        message_id = message.get("messageId", "")

        await self.sio.emit("ack", (message_id, True), to=sid)

        broadcast_message = {
            "type": message_type,
            "userId": user_id,
            "mindmapId": mindmap_id,
            "data": message.get("data", {}),
            "timestamp": time.time(),
            "messageId": message_id,
        }

        await self.sio.emit(
            "message",
            broadcast_message,
            room=mindmap_id,
            skip_sid=sid,
        )

    def get_user_count(self, mindmap_id: str) -> int:
        return len(self.rooms.get(mindmap_id, set()))

    def get_room_users(self, mindmap_id: str) -> List[str]:
        room = self.rooms.get(mindmap_id, set())
        return [self.user_names.get(sid, "") for sid in room]


socket_manager = SocketManager()
