from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json

app = FastAPI(title="会议协作 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class User(BaseModel):
    id: str
    name: str
    avatar: str
    color: str


class Vote(BaseModel):
    userId: str
    type: str


class Comment(BaseModel):
    id: str
    userId: str
    userName: str
    userAvatar: str
    userColor: str
    content: str
    timestamp: int


class AgendaItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    responsible: str
    duration: int
    status: str
    order: int
    comments: List[Comment] = []
    votes: List[Vote] = []
    resolution: Optional[str] = None
    todo: Optional[str] = None
    todoDueDate: Optional[str] = None
    todoPriority: Optional[str] = None


class Meeting(BaseModel):
    id: str
    title: str
    date: str
    time: str
    location: str
    participants: List[User] = []
    agendaItems: List[AgendaItem] = []
    status: str
    createdAt: int


class Task(BaseModel):
    id: str
    title: str
    meetingId: str
    meetingTitle: str
    agendaItemId: str
    responsible: str
    dueDate: Optional[str] = None
    priority: str
    status: str
    createdAt: int


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append(websocket)

    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].remove(websocket)
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast(self, meeting_id: str, message: dict):
        if meeting_id in self.active_connections:
            for connection in self.active_connections[meeting_id]:
                await connection.send_json(message)


manager = ConnectionManager()

mock_users = [
    User(id="u1", name="张三", avatar="ZS", color="#6c63ff"),
    User(id="u2", name="李四", avatar="LS", color="#f59e0b"),
    User(id="u3", name="王五", avatar="WW", color="#10b981"),
    User(id="u4", name="赵六", avatar="ZL", color="#ef4444"),
    User(id="u5", name="钱七", avatar="QQ", color="#8b5cf6"),
]


def generate_mock_meetings(count: int = 20) -> List[Meeting]:
    meetings = []
    statuses = ["upcoming", "ongoing", "ended"]
    agenda_statuses = ["pending", "discussing", "resolved", "postponed"]
    titles = [
        "产品需求评审会", "技术方案研讨会", "周例会", "月度总结会", "项目启动会",
        "设计评审会", "代码审查会", "客户沟通会", "战略规划会", "团队建设会",
    ]
    locations = ["会议室A", "会议室B", "线上-腾讯会议", "线上-飞书", "大会议室"]

    for i in range(count):
        meeting_date = datetime.now()
        meeting_date = meeting_date.replace(day=max(1, (meeting_date.day - i * 2) % 28))
        date_str = meeting_date.strftime("%Y-%m-%d")
        hours = 9 + (i % 8)
        time_str = f"{hours:02d}:{('00' if i % 2 == 0 else '30')}"

        agenda_count = 3 + (i % 5)
        agenda_items = []
        for j in range(agenda_count):
            durations = [5, 10, 15, 20, 30, 45, 60]
            duration = durations[j % len(durations)]
            status = agenda_statuses[j % len(agenda_statuses)]

            comments = []
            if j % 2 == 0:
                for k in range(2):
                    user = mock_users[k % len(mock_users)]
                    comments.append(Comment(
                        id=f"c-{i}-{j}-{k}",
                        userId=user.id,
                        userName=user.name,
                        userAvatar=user.avatar,
                        userColor=user.color,
                        content=f"这是关于议程项{j+1}的第{k+1}条评论。",
                        timestamp=int(datetime.now().timestamp() * 1000) - k * 60000,
                    ))

            votes = []
            if j % 3 == 0:
                for v in range(3):
                    vote_types = ["agree", "disagree", "abstain"]
                    votes.append(Vote(
                        userId=mock_users[v].id,
                        type=vote_types[v % 3],
                    ))

            todo_text = None
            todo_priority = None
            if status == "resolved" and j % 2 == 0:
                todo_text = f"完成议程项{j+1}的后续工作"
                priorities = ["high", "medium", "low"]
                todo_priority = priorities[j % 3]

            agenda_items.append(AgendaItem(
                id=f"a-{i}-{j}",
                title=f"议程项 {j+1}：讨论{titles[(j+i) % len(titles)]}相关问题",
                description="这是议程项的详细描述。",
                responsible=mock_users[j % len(mock_users)].name,
                duration=duration,
                status=status,
                order=j,
                comments=comments,
                votes=votes,
                resolution="已达成共识。" if status == "resolved" else None,
                todo=todo_text,
                todoDueDate=(datetime.now().strftime("%Y-%m-%d") if todo_text else None),
                todoPriority=todo_priority,
            ))

        participant_count = 3 + (i % 7)
        participants = mock_users[:participant_count]

        meetings.append(Meeting(
            id=f"m-{i}",
            title=titles[i % len(titles)] + f" #{i+1}",
            date=date_str,
            time=time_str,
            location=locations[i % len(locations)],
            participants=participants,
            agendaItems=agenda_items,
            status=statuses[i % len(statuses)],
            createdAt=int(datetime.now().timestamp() * 1000) - i * 86400000,
        ))

    meetings.sort(key=lambda m: m.createdAt, reverse=True)
    return meetings


meetings_db = generate_mock_meetings(50)
tasks_db: List[Task] = []


def init_tasks():
    global tasks_db
    tasks = []
    task_id = 0
    for meeting in meetings_db:
        for item in meeting.agendaItems:
            if item.todo and item.status == "resolved":
                statuses = ["todo", "in-progress", "done"]
                tasks.append(Task(
                    id=f"t-{task_id}",
                    title=item.todo,
                    meetingId=meeting.id,
                    meetingTitle=meeting.title,
                    agendaItemId=item.id,
                    responsible=item.responsible,
                    dueDate=item.todoDueDate,
                    priority=item.todoPriority or "medium",
                    status=statuses[task_id % 3],
                    createdAt=meeting.createdAt,
                ))
                task_id += 1
    tasks_db = tasks


init_tasks()


@app.get("/api/meetings")
def get_meetings(q: Optional[str] = Query(None)):
    result = meetings_db
    if q:
        query = q.lower()
        result = [m for m in meetings_db if query in m.title.lower()]
    return result


@app.get("/api/meetings/{meeting_id}")
def get_meeting(meeting_id: str):
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            return meeting
    raise HTTPException(status_code=404, detail="Meeting not found")


@app.post("/api/meetings")
def create_meeting(meeting_data: dict):
    new_id = f"m-{uuid.uuid4().hex[:8]}"
    new_meeting = Meeting(
        id=new_id,
        title=meeting_data.get("title", ""),
        date=meeting_data.get("date", ""),
        time=meeting_data.get("time", ""),
        location=meeting_data.get("location", ""),
        participants=[],
        agendaItems=[],
        status=meeting_data.get("status", "upcoming"),
        createdAt=int(datetime.now().timestamp() * 1000),
    )
    meetings_db.insert(0, new_meeting)
    return new_meeting


@app.put("/api/meetings/{meeting_id}")
def update_meeting(meeting_id: str, update_data: dict):
    for i, meeting in enumerate(meetings_db):
        if meeting.id == meeting_id:
            updated = meeting.model_copy(update={k: v for k, v in update_data.items() if k != 'agendaItems'})
            meetings_db[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Meeting not found")


@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: str):
    for i, meeting in enumerate(meetings_db):
        if meeting.id == meeting_id:
            del meetings_db[i]
            return {"message": "Meeting deleted"}
    raise HTTPException(status_code=404, detail="Meeting not found")


@app.post("/api/meetings/{meeting_id}/agenda")
def add_agenda_item(meeting_id: str, item_data: dict):
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            new_item = AgendaItem(
                id=f"a-{uuid.uuid4().hex[:8]}",
                title=item_data.get("title", ""),
                description=item_data.get("description", ""),
                responsible=item_data.get("responsible", ""),
                duration=item_data.get("duration", 15),
                status=item_data.get("status", "pending"),
                order=len(meeting.agendaItems),
                comments=[],
                votes=[],
            )
            meeting.agendaItems.append(new_item)
            return new_item
    raise HTTPException(status_code=404, detail="Meeting not found")


@app.put("/api/meetings/{meeting_id}/agenda/{item_id}")
def update_agenda_item(meeting_id: str, item_id: str, update_data: dict):
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            for i, item in enumerate(meeting.agendaItems):
                if item.id == item_id:
                    updated = item.model_copy(update=update_data)
                    meeting.agendaItems[i] = updated
                    return updated
    raise HTTPException(status_code=404, detail="Agenda item not found")


@app.put("/api/meetings/{meeting_id}/agenda-order")
def update_agenda_order(meeting_id: str, data: dict):
    item_ids = data.get("itemIds", [])
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            item_map = {item.id: item for item in meeting.agendaItems}
            sorted_items = []
            for idx, item_id in enumerate(item_ids):
                if item_id in item_map:
                    item = item_map[item_id].model_copy(update={"order": idx})
                    sorted_items.append(item)
            meeting.agendaItems = sorted_items
            return {"message": "Order updated"}
    raise HTTPException(status_code=404, detail="Meeting not found")


@app.delete("/api/meetings/{meeting_id}/agenda/{item_id}")
def delete_agenda_item(meeting_id: str, item_id: str):
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            for i, item in enumerate(meeting.agendaItems):
                if item.id == item_id:
                    del meeting.agendaItems[i]
                    return {"message": "Agenda item deleted"}
    raise HTTPException(status_code=404, detail="Agenda item not found")


@app.post("/api/meetings/{meeting_id}/agenda/{item_id}/comments")
def add_comment(meeting_id: str, item_id: str, data: dict):
    content = data.get("content", "")
    current_user = mock_users[0]
    new_comment = Comment(
        id=f"c-{uuid.uuid4().hex[:8]}",
        userId=current_user.id,
        userName=current_user.name,
        userAvatar=current_user.avatar,
        userColor=current_user.color,
        content=content,
        timestamp=int(datetime.now().timestamp() * 1000),
    )
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            for item in meeting.agendaItems:
                if item.id == item_id:
                    item.comments.append(new_comment)
                    return new_comment
    raise HTTPException(status_code=404, detail="Agenda item not found")


@app.post("/api/meetings/{meeting_id}/agenda/{item_id}/votes")
def cast_vote(meeting_id: str, item_id: str, data: dict):
    vote_type = data.get("type", "agree")
    current_user = mock_users[0]
    new_vote = Vote(userId=current_user.id, type=vote_type)

    for meeting in meetings_db:
        if meeting.id == meeting_id:
            for item in meeting.agendaItems:
                if item.id == item_id:
                    existing = next((v for v in item.votes if v.userId == current_user.id), None)
                    if existing:
                        existing.type = vote_type
                    else:
                        item.votes.append(new_vote)
                    return new_vote
    raise HTTPException(status_code=404, detail="Agenda item not found")


@app.put("/api/meetings/{meeting_id}/agenda/{item_id}/status")
def update_status(meeting_id: str, item_id: str, data: dict):
    status = data.get("status", "pending")
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            for i, item in enumerate(meeting.agendaItems):
                if item.id == item_id:
                    updated = item.model_copy(update={"status": status})
                    meeting.agendaItems[i] = updated
                    return updated
    raise HTTPException(status_code=404, detail="Agenda item not found")


@app.get("/api/tasks")
def get_tasks():
    return tasks_db


@app.get("/api/tasks/meeting/{meeting_id}")
def get_tasks_by_meeting(meeting_id: str):
    return [t for t in tasks_db if t.meetingId == meeting_id]


@app.put("/api/tasks/{task_id}/status")
def update_task_status(task_id: str, data: dict):
    status = data.get("status", "todo")
    for i, task in enumerate(tasks_db):
        if task.id == task_id:
            updated = task.model_copy(update={"status": status})
            tasks_db[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Task not found")


@app.post("/api/tasks/generate/{meeting_id}")
def generate_tasks(meeting_id: str):
    new_tasks = []
    for meeting in meetings_db:
        if meeting.id == meeting_id:
            for item in meeting.agendaItems:
                if item.todo and item.status == "resolved":
                    new_task = Task(
                        id=f"t-{uuid.uuid4().hex[:8]}",
                        title=item.todo,
                        meetingId=meeting.id,
                        meetingTitle=meeting.title,
                        agendaItemId=item.id,
                        responsible=item.responsible,
                        dueDate=item.todoDueDate,
                        priority=item.todoPriority or "medium",
                        status="todo",
                        createdAt=int(datetime.now().timestamp() * 1000),
                    )
                    tasks_db.insert(0, new_task)
                    new_tasks.append(new_task)
            return new_tasks
    raise HTTPException(status_code=404, detail="Meeting not found")


@app.get("/api/users/me")
def get_current_user():
    return mock_users[0]


@app.get("/api/users")
def get_users():
    return mock_users


@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    await manager.connect(websocket, meeting_id)
    try:
        while True:
            data = await websocket.receive_json()

            event_type = data.get("type", "message")
            user_id = data.get("userId", "anonymous")

            message = {
                "type": event_type,
                "meetingId": meeting_id,
                "userId": user_id,
                "timestamp": int(datetime.now().timestamp() * 1000),
            }

            if event_type == "comment":
                agenda_item_id = data.get("agendaItemId", "")
                content = data.get("content", "")
                current_user = mock_users[0]
                new_comment = Comment(
                    id=f"c-{uuid.uuid4().hex[:8]}",
                    userId=current_user.id,
                    userName=current_user.name,
                    userAvatar=current_user.avatar,
                    userColor=current_user.color,
                    content=content,
                    timestamp=int(datetime.now().timestamp() * 1000),
                )
                for meeting in meetings_db:
                    if meeting.id == meeting_id:
                        for item in meeting.agendaItems:
                            if item.id == agenda_item_id:
                                item.comments.append(new_comment)
                                break
                message["data"] = {
                    "agendaItemId": agenda_item_id,
                    "comment": new_comment.model_dump(),
                }

            elif event_type == "vote":
                agenda_item_id = data.get("agendaItemId", "")
                vote_type = data.get("type", "agree")
                current_user = mock_users[0]
                new_vote = Vote(userId=current_user.id, type=vote_type)
                for meeting in meetings_db:
                    if meeting.id == meeting_id:
                        for item in meeting.agendaItems:
                            if item.id == agenda_item_id:
                                existing = next((v for v in item.votes if v.userId == current_user.id), None)
                                if existing:
                                    existing.type = vote_type
                                else:
                                    item.votes.append(new_vote)
                                new_vote = Vote(userId=current_user.id, type=vote_type)
                                break
                message["data"] = {
                    "agendaItemId": agenda_item_id,
                    "vote": new_vote.model_dump(),
                }

            elif event_type == "status_change":
                agenda_item_id = data.get("agendaItemId", "")
                status = data.get("status", "pending")
                for meeting in meetings_db:
                    if meeting.id == meeting_id:
                        for i, item in enumerate(meeting.agendaItems):
                            if item.id == agenda_item_id:
                                meeting.agendaItems[i] = item.model_copy(update={"status": status})
                                break
                message["data"] = {
                    "agendaItemId": agenda_item_id,
                    "status": status,
                }

            elif event_type == "agenda_order":
                item_ids = data.get("itemIds", [])
                for meeting in meetings_db:
                    if meeting.id == meeting_id:
                        item_map = {item.id: item for item in meeting.agendaItems}
                        sorted_items = []
                        for idx, item_id in enumerate(item_ids):
                            if item_id in item_map:
                                item = item_map[item_id].model_copy(update={"order": idx})
                                sorted_items.append(item)
                        meeting.agendaItems = sorted_items
                message["data"] = {
                    "itemIds": item_ids,
                }

            else:
                message["data"] = data.get("data", {})

            await manager.broadcast(meeting_id, message)
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)


@app.get("/")
def root():
    return {"message": "会议协作 API 服务运行中", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
