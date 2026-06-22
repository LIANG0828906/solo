import asyncio
import random
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
import uvicorn

from grouping_algorithm import balanced_grouping, random_grouping


app = FastAPI(title="活动分组系统", description="支持实时分组与团队消息广播的后端服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
socket_app = socketio.ASGIApp(sio, app)


SURNAME_LIST = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈", "褚", "卫",
                "蒋", "沈", "韩", "杨", "朱", "秦", "尤", "许", "何", "吕", "施", "张",
                "孔", "曹", "严", "华", "金", "魏", "陶", "姜", "戚", "谢", "邹", "喻",
                "柏", "水", "窦", "章", "云", "苏", "潘", "葛", "奚", "范", "彭", "郎"]

GIVEN_NAME_LIST = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳",
                   "杰", "娟", "涛", "明", "超", "秀英", "霞", "平", "刚", "桂英", "文", "辉",
                   "鑫", "鹏", "华", "玲", "辉", "建", "峰", "建国", "建军", "建平", "建华", "志明",
                   "玉兰", "桂兰", "淑芬", "秀珍", "丽娟", "玉梅", "凤英", "翠英", "雪梅", "丽华",
                   "思远", "浩然", "子轩", "雨泽", "梓涵", "梓轩", "诗涵", "可馨", "一诺", "子墨"]


activities: Dict[str, Dict[str, Any]] = {}
activity_rooms: Dict[str, set] = {}


def generate_random_chinese_name() -> str:
    surname = random.choice(SURNAME_LIST)
    given_name = random.choice(GIVEN_NAME_LIST)
    return surname + given_name


class ParticipantInput(BaseModel):
    name: str


class CreateActivityRequest(BaseModel):
    name: str
    participant_count: int
    team_size: int
    strategy: str = "balanced"
    participants: Optional[List[ParticipantInput]] = None


class ManualMoveRequest(BaseModel):
    activity_id: str
    member_id: str
    from_team_id: Optional[int] = None
    to_team_id: int


class TeamMessageRequest(BaseModel):
    activity_id: str
    team_id: int
    sender: str
    text: str


async def emit_to_activity(activity_id: str, event: str, data: Any):
    room_sids = activity_rooms.get(activity_id, set())
    for sid in room_sids:
        try:
            await sio.emit(event, data, to=sid)
        except Exception:
            pass


@app.get("/")
def root():
    return {"message": "活动分组系统后端服务运行中"}


@app.post("/api/activities")
def create_activity(request: CreateActivityRequest):
    if request.strategy not in ("balanced", "random"):
        raise HTTPException(status_code=400, detail="不支持的分组策略")
    if request.team_size < 5 or request.team_size > 10:
        raise HTTPException(status_code=400, detail="每组人数必须在5-10之间")

    activity_id = str(uuid.uuid4())
    participants = []

    if request.participants and len(request.participants) > 0:
        seen_names: set = set()
        name_list: List[str] = []
        for p in request.participants:
            raw_name = p.name
            if not isinstance(raw_name, str):
                continue
            name = str(raw_name).strip()
            if not name or len(name) == 0:
                continue
            if name in seen_names:
                continue
            seen_names.add(name)
            name_list.append(name)
            participants.append({
                "id": str(uuid.uuid4()),
                "name": name
            })
        if len(participants) < 20 or len(participants) > 100:
            raise HTTPException(status_code=400, detail=f"导入的有效参与人数为{len(participants)}人，必须在20-100之间")
        participant_count = len(participants)
    else:
        if request.participant_count < 20 or request.participant_count > 100:
            raise HTTPException(status_code=400, detail="参与人数必须在20-100之间")
        participant_count = request.participant_count
        for _ in range(participant_count):
            participants.append({
                "id": str(uuid.uuid4()),
                "name": generate_random_chinese_name()
            })

    group_count = (participant_count + request.team_size - 1) // request.team_size

    activity = {
        "id": activity_id,
        "name": request.name,
        "participants": participants,
        "participant_count": participant_count,
        "team_size": request.team_size,
        "group_count": group_count,
        "strategy": request.strategy,
        "groups": {},
        "created_at": datetime.now().isoformat()
    }
    activities[activity_id] = activity
    activity_rooms[activity_id] = set()
    return activity


@app.get("/api/activities/{activity_id}")
def get_activity(activity_id: str):
    if activity_id not in activities:
        raise HTTPException(status_code=404, detail="活动不存在")
    return activities[activity_id]


@app.get("/api/activities")
def list_activities():
    return list(activities.values())


@sio.event
async def connect(sid, environ):
    print(f"客户端连接: {sid}")


@sio.event
async def disconnect(sid):
    print(f"客户端断开: {sid}")
    for activity_id, sids in activity_rooms.items():
        if sid in sids:
            sids.discard(sid)
            break


@sio.event
async def join_activity(sid, data):
    activity_id = data.get("activity_id")
    if not activity_id:
        await sio.emit("error", {"message": "缺少活动ID"}, to=sid)
        return
    if activity_id not in activity_rooms:
        activity_rooms[activity_id] = set()
    activity_rooms[activity_id].add(sid)
    if activity_id in activities:
        activity = activities[activity_id]
        await sio.emit("activity_info", {
            "activity": activity,
            "groups": activity.get("groups", {})
        }, to=sid)
    print(f"客户端 {sid} 加入活动 {activity_id}")


@sio.event
async def start_grouping(sid, data):
    activity_id = data.get("activity_id")
    if not activity_id or activity_id not in activities:
        await sio.emit("error", {"message": "活动不存在"}, to=sid)
        return

    activity = activities[activity_id]
    strategy = activity["strategy"]
    participants = activity["participants"]
    group_count = activity["group_count"]

    await asyncio.sleep(0.5)

    if strategy == "balanced":
        raw_groups = balanced_grouping(participants, group_count)
    else:
        raw_groups = random_grouping(participants, group_count)

    groups: Dict[str, Dict[str, Any]] = {}
    for i, members in enumerate(raw_groups):
        groups[str(i)] = {
            "members": [{"id": m["id"], "name": m["name"]} for m in members],
            "messages": []
        }

    activity["groups"] = groups

    result = {
        "activity_id": activity_id,
        "groups": groups,
        "strategy": strategy,
        "timestamp": datetime.now().isoformat()
    }
    await emit_to_activity(activity_id, "group_result", result)


@sio.event
async def manual_move(sid, data):
    activity_id = data.get("activity_id")
    member_id = data.get("member_id")
    from_team_id = data.get("from_team_id")
    to_team_id = data.get("to_team_id")

    if not activity_id or activity_id not in activities:
        await sio.emit("error", {"message": "活动不存在"}, to=sid)
        return

    activity = activities[activity_id]
    groups = activity.get("groups")
    if not groups:
        await sio.emit("error", {"message": "尚未分组，请先执行分组"}, to=sid)
        return

    if str(to_team_id) not in groups:
        await sio.emit("error", {"message": "目标团队不存在"}, to=sid)
        return

    member: Optional[Dict[str, Any]] = None

    if from_team_id is not None and str(from_team_id) in groups:
        from_team = groups[str(from_team_id)]
        for m in from_team["members"]:
            if m["id"] == member_id:
                member = m
                break
        if member:
            from_team["members"] = [m for m in from_team["members"] if m["id"] != member_id]

    if member is None:
        for p in activity["participants"]:
            if p["id"] == member_id:
                member = {"id": p["id"], "name": p["name"]}
                break

    if member:
        to_team = groups[str(to_team_id)]
        to_team["members"].append(member)

        result = {
            "activity_id": activity_id,
            "groups": groups,
            "member_id": member_id,
            "from_team_id": from_team_id,
            "to_team_id": to_team_id,
            "timestamp": datetime.now().isoformat()
        }
        await emit_to_activity(activity_id, "groups_updated", result)


@sio.event
async def team_message(sid, data):
    activity_id = data.get("activity_id")
    team_id = data.get("team_id")
    sender = data.get("sender", "匿名")
    text = data.get("text", "")

    if not activity_id or activity_id not in activities:
        await sio.emit("error", {"message": "活动不存在"}, to=sid)
        return

    activity = activities[activity_id]
    groups = activity.get("groups")
    if not groups:
        await sio.emit("error", {"message": "尚未分组"}, to=sid)
        return
    if str(team_id) not in groups:
        await sio.emit("error", {"message": "团队不存在"}, to=sid)
        return

    message = {
        "id": str(uuid.uuid4()),
        "sender": sender,
        "text": text,
        "time": datetime.now().strftime("%H:%M:%S")
    }

    groups[str(team_id)]["messages"].append(message)

    result = {
        "activity_id": activity_id,
        "team_id": team_id,
        "message": message
    }
    await emit_to_activity(activity_id, "team_message", result)


if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8001)
