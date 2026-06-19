import uuid
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Team Kanban API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Note(BaseModel):
    id: str
    content: str
    author: str
    createdAt: str


class Task(BaseModel):
    id: str
    title: str
    description: str = ""
    status: str
    priority: str = "medium"
    dueDate: Optional[str] = None
    assignee: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    notes: List[Note] = Field(default_factory=list)
    order: int = 0
    createdAt: str
    updatedAt: str


class Lane(BaseModel):
    id: str
    title: str
    order: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dueDate: Optional[str] = None
    assignee: Optional[str] = None
    tags: Optional[List[str]] = None
    order: Optional[int] = None


class TaskCreate(BaseModel):
    title: str
    status: str
    priority: str = "medium"


class NoteCreate(BaseModel):
    content: str
    author: str


class LaneCreate(BaseModel):
    title: str


class LaneUpdate(BaseModel):
    title: str


class WSMessage(BaseModel):
    type: str
    data: Any


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


lanes_db: Dict[str, Lane] = {
    "todo": Lane(id="todo", title="待办", order=0),
    "in_progress": Lane(id="in_progress", title="进行中", order=1),
    "done": Lane(id="done", title="已完成", order=2),
}

tasks_db: Dict[str, Task] = {}
MAX_TASKS = 50


def generate_sample_data():
    sample_tasks = [
        {
            "title": "修复登录页面样式问题",
            "status": "todo",
            "priority": "high",
            "tags": ["Bug", "紧急"],
            "description": "移动端登录按钮显示异常，需要修复布局",
        },
        {
            "title": "实现用户注册功能",
            "status": "todo",
            "priority": "medium",
            "tags": ["功能"],
            "description": "支持邮箱注册和验证码验证",
        },
        {
            "title": "优化数据库查询性能",
            "status": "in_progress",
            "priority": "medium",
            "tags": ["优化"],
            "description": "为常用查询添加索引，减少响应时间",
            "assignee": "张三",
        },
        {
            "title": "设计新版首页UI",
            "status": "in_progress",
            "priority": "low",
            "tags": ["设计"],
            "description": "参考竞品设计更现代的首页界面",
        },
        {
            "title": "编写API接口文档",
            "status": "done",
            "priority": "low",
            "tags": ["文档"],
            "description": "使用Swagger规范编写完整API文档",
            "notes": [
                Note(
                    id=str(uuid.uuid4()),
                    content="已完成v1.0版本文档",
                    author="李四",
                    createdAt=now_iso(),
                )
            ],
        },
        {
            "title": "添加任务拖拽功能",
            "status": "done",
            "priority": "high",
            "tags": ["功能"],
            "description": "支持任务在泳道间拖拽移动",
        },
    ]

    for i, t in enumerate(sample_tasks):
        task_id = str(uuid.uuid4())
        tasks_db[task_id] = Task(
            id=task_id,
            title=t["title"],
            description=t.get("description", ""),
            status=t["status"],
            priority=t["priority"],
            tags=t.get("tags", []),
            assignee=t.get("assignee"),
            notes=t.get("notes", []),
            order=i,
            createdAt=now_iso(),
            updatedAt=now_iso(),
        )


generate_sample_data()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: WSMessage):
        for connection in self.active_connections:
            try:
                await connection.send_json(message.dict())
            except Exception:
                pass


manager = ConnectionManager()


@app.get("/tasks")
async def get_all_tasks():
    tasks_list = sorted(tasks_db.values(), key=lambda t: (t.status, t.order))
    lanes_list = sorted(lanes_db.values(), key=lambda l: l.order)
    return {"tasks": tasks_list, "lanes": lanes_list}


@app.post("/tasks")
async def create_task(task_data: TaskCreate):
    if len(tasks_db) >= MAX_TASKS:
        raise HTTPException(status_code=400, detail=f"任务数量已达上限 {MAX_TASKS}")

    task_id = str(uuid.uuid4())
    lane_tasks = [t for t in tasks_db.values() if t.status == task_data.status]
    new_order = len(lane_tasks)

    task = Task(
        id=task_id,
        title=task_data.title,
        status=task_data.status,
        priority=task_data.priority,
        order=new_order,
        createdAt=now_iso(),
        updatedAt=now_iso(),
    )
    tasks_db[task_id] = task

    await manager.broadcast(WSMessage(type="task_created", data=task))
    return task


@app.put("/tasks/{task_id}")
async def update_task(task_id: str, updates: TaskUpdate):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks_db[task_id]
    update_data = updates.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(task, key, value)

    task.updatedAt = now_iso()
    tasks_db[task_id] = task

    await manager.broadcast(WSMessage(type="task_updated", data=task))
    return task


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks_db.pop(task_id)

    lane_tasks = sorted(
        [t for t in tasks_db.values() if t.status == task.status],
        key=lambda t: t.order,
    )
    for idx, t in enumerate(lane_tasks):
        t.order = idx
        tasks_db[t.id] = t

    await manager.broadcast(WSMessage(type="task_deleted", data=task))
    return {"success": True}


@app.post("/tasks/{task_id}/notes")
async def add_task_note(task_id: str, note_data: NoteCreate):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")

    note = Note(
        id=str(uuid.uuid4()),
        content=note_data.content,
        author=note_data.author,
        createdAt=now_iso(),
    )

    task = tasks_db[task_id]
    task.notes.insert(0, note)
    task.updatedAt = now_iso()
    tasks_db[task_id] = task

    note_with_task = note.dict()
    note_with_task["taskId"] = task_id

    await manager.broadcast(WSMessage(type="note_added", data=note_with_task))
    return note


@app.get("/lanes")
async def get_lanes():
    return sorted(lanes_db.values(), key=lambda l: l.order)


@app.post("/lanes")
async def create_lane(lane_data: LaneCreate):
    lane_id = str(uuid.uuid4())
    max_order = max((l.order for l in lanes_db.values()), default=-1)

    lane = Lane(id=lane_id, title=lane_data.title, order=max_order + 1)
    lanes_db[lane_id] = lane

    await manager.broadcast(WSMessage(type="lane_created", data=lane))
    return lane


@app.put("/lanes/{lane_id}")
async def update_lane(lane_id: str, lane_data: LaneUpdate):
    if lane_id not in lanes_db:
        raise HTTPException(status_code=404, detail="泳道不存在")

    lane = lanes_db[lane_id]
    lane.title = lane_data.title
    lanes_db[lane_id] = lane

    await manager.broadcast(WSMessage(type="lane_updated", data=lane))
    return lane


@app.delete("/lanes/{lane_id}")
async def delete_lane(lane_id: str):
    if lane_id not in lanes_db:
        raise HTTPException(status_code=404, detail="泳道不存在")

    lane = lanes_db.pop(lane_id)

    tasks_to_delete = [t.id for t in tasks_db.values() if t.status == lane_id]
    for tid in tasks_to_delete:
        del tasks_db[tid]

    remaining_lanes = sorted(lanes_db.values(), key=lambda l: l.order)
    for idx, l in enumerate(remaining_lanes):
        l.order = idx
        lanes_db[l.id] = l

    await manager.broadcast(WSMessage(type="lane_deleted", data=lane))
    return {"success": True}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
