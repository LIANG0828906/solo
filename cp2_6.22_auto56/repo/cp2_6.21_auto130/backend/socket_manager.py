import socketio
from typing import Dict, Set, Any


class SocketManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            async_mode="asgi",
            logger=False,
            engineio_logger=False
        )
        self.rooms: Dict[str, Set[str]] = {}
        self._register_handlers()

    def get_app(self):
        return socketio.ASGIApp(self.sio)

    def _register_handlers(self):
        @self.sio.event
        async def connect(sid: str, environ: dict):
            pass

        @self.sio.event
        async def disconnect(sid: str):
            for room_id in list(self.rooms.keys()):
                if sid in self.rooms[room_id]:
                    self.rooms[room_id].discard(sid)
                    if not self.rooms[room_id]:
                        del self.rooms[room_id]

        @self.sio.event
        async def join(sid: str, data: dict):
            room_id = data.get("room_id")
            if room_id:
                await self.sio.enter_room(sid, room_id)
                if room_id not in self.rooms:
                    self.rooms[room_id] = set()
                self.rooms[room_id].add(sid)
                user_id = data.get("userId")
                nickname = data.get("nickname")
                await self.sio.emit(
                    "room:join",
                    {"userId": user_id, "nickname": nickname},
                    room=room_id,
                    skip_sid=sid
                )

        @self.sio.event
        async def leave(sid: str, data: dict):
            room_id = data.get("room_id")
            if room_id:
                await self.sio.leave_room(sid, room_id)
                if room_id in self.rooms:
                    self.rooms[room_id].discard(sid)
                    if not self.rooms[room_id]:
                        del self.rooms[room_id]

    async def broadcast_to_room(self, room_id: str, event: str, data: Any):
        await self.sio.emit(event, data, room=room_id)

    async def broadcast_meal_plan_updated(self, room_id: str, entry: dict, action: str, by: dict):
        await self.broadcast_to_room(
            room_id,
            "meal-plan:updated",
            {"entry": entry, "action": action, "by": by}
        )

    async def broadcast_shopping_list_checked(self, room_id: str, ingredient_id: str, purchased: bool, by: dict):
        await self.broadcast_to_room(
            room_id,
            "shopping-list:checked",
            {"ingredientId": ingredient_id, "purchased": purchased, "by": by}
        )

    async def broadcast_comment_new(self, room_id: str, comment: dict):
        await self.broadcast_to_room(room_id, "comment:new", {"comment": comment})


socket_manager = SocketManager()
