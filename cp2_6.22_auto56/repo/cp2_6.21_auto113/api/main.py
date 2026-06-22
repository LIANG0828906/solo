from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
import uvicorn

TaskStatus = str  # 'pending' | 'reviewing' | 'approved' | 'changes_needed'
TaskPriority = str  # 'high' | 'medium' | 'low'

STATUS_COLUMNS = ['pending', 'reviewing', 'approved', 'changes_needed']
VALID_PRIORITIES = ['high', 'medium', 'low']


def hash_name_to_color(name: str) -> str:
    colors = [
        '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
        '#009688', '#4caf50', '#ff9800', '#f44336', '#795548',
        '#607d8b', '#00bcd4', '#ff5722', '#8bc34a', '#cddc39',
    ]
    h = 0
    for c in name:
        h = ord(c) + ((h << 5) - h)
    return colors[abs(h) % len(colors)]


class UserInDB(BaseModel):
    id: str
    name: str
    avatarColor: str
    isOnline: bool
    activeTasks: int = 0


class CreateTaskPayload(BaseModel):
    title: str
    description: str = ''
    repoUrl: str = ''
    submitterId: str
    priority: TaskPriority = 'medium'
    reviewerId: Optional[str] = None


class UpdateStatusPayload(BaseModel):
    status: TaskStatus


class TaskInDB(BaseModel):
    id: str
    title: str
    description: str
    repoUrl: str
    status: TaskStatus
    priority: TaskPriority
    createdAt: str
    updatedAt: str
    submitterId: str
    reviewerId: Optional[str] = None


def now_iso() -> str:
    return datetime.utcnow().isoformat() + 'Z'


sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False,
)

app = FastAPI(title='Code Review Board API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

reviewers_db: Dict[str, UserInDB] = {}
submitters_db: Dict[str, UserInDB] = {}
tasks_db: Dict[str, TaskInDB] = {}


def get_initial_users() -> List[UserInDB]:
    names = ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九']
    users: List[UserInDB] = []
    for i, name in enumerate(names):
        users.append(UserInDB(
            id=f'r{i+1}',
            name=name,
            avatarColor=hash_name_to_color(name),
            isOnline=(i != 3),
            activeTasks=0,
        ))
    return users


def get_initial_tasks() -> List[TaskInDB]:
    now = datetime.utcnow()
    titles = [
        ('修复用户登录Token过期问题', 'pending', 0, 'high'),
        ('重构API中间件，支持流式响应', 'reviewing', 1, 'medium'),
        ('新增数据导出CSV功能', 'approved', 2, 'low'),
        ('修复商品列表分页Bug', 'changes_needed', 0, 'high'),
        ('优化首页加载速度，懒加载图片', 'pending', 1, 'medium'),
        ('添加单元测试覆盖Auth模块', 'reviewing', 2, 'low'),
        ('修复移动端输入框被键盘遮挡', 'pending', 0, 'high'),
    ]
    tasks: List[TaskInDB] = []
    for i, (title, status, reviewer_idx, priority) in enumerate(titles):
        reviewer_ids = [rid for rid, r in reviewers_db.items() if r.isOnline]
        reviewer_id = reviewer_ids[reviewer_idx % len(reviewer_ids)] if reviewer_ids else None
        if reviewer_id and reviewer_id in reviewers_db:
            reviewers_db[reviewer_id].activeTasks += 1
        created = now.timestamp() - (3600 + i * 600)
        updated = now.timestamp() - (i * 180 + 30)
        tasks.append(TaskInDB(
            id=f't-init-{i}',
            title=title,
            description='**紧急**：需要 `本周` 内完成代码审查，否则影响发版。' if i % 3 == 0 else '',
            repoUrl=f'https://github.com/org/repo/pull/{100 + i}',
            status=status,
            priority=priority,
            createdAt=datetime.fromtimestamp(created).isoformat() + 'Z',
            updatedAt=datetime.fromtimestamp(updated).isoformat() + 'Z',
            submitterId='r1',
            reviewerId=reviewer_id,
        ))
    return tasks


def task_to_public(task: TaskInDB) -> Dict[str, Any]:
    reviewer = reviewers_db.get(task.reviewerId) if task.reviewerId else None
    submitter = submitters_db.get(task.submitterId) or reviewers_db.get(task.submitterId)
    return {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'repoUrl': task.repoUrl,
        'status': task.status,
        'priority': task.priority,
        'createdAt': task.createdAt,
        'updatedAt': task.updatedAt,
        'submitter': submitter.model_dump() if submitter else None,
        'reviewer': reviewer.model_dump() if reviewer else None,
    }


def assign_reviewer_round_robin() -> Optional[UserInDB]:
    online_reviewers = [r for r in reviewers_db.values() if r.isOnline]
    if not online_reviewers:
        return None
    online_reviewers.sort(key=lambda u: (u.activeTasks, u.id))
    chosen = online_reviewers[0]
    chosen.activeTasks += 1
    return chosen


@app.on_event('startup')
async def on_startup():
    for u in get_initial_users():
        reviewers_db[u.id] = u
        submitters_db[u.id] = u
    for t in get_initial_tasks():
        tasks_db[t.id] = t
    print('[API] initialized with', len(reviewers_db), 'reviewers and', len(tasks_db), 'tasks')


@app.get('/api/health')
async def health():
    return {'status': 'ok', 'tasks': len(tasks_db), 'reviewers': len(reviewers_db)}


@app.get('/api/tasks')
async def list_tasks():
    tasks = sorted(tasks_db.values(), key=lambda t: t.updatedAt, reverse=True)
    return [task_to_public(t) for t in tasks]


@app.post('/api/tasks', status_code=201)
async def create_task(payload: CreateTaskPayload):
    task_id = f't-{uuid.uuid4().hex[:10]}'
    now = now_iso()

    if payload.submitterId not in submitters_db and payload.submitterId not in reviewers_db:
        name = '访客用户'
        submitters_db[payload.submitterId] = UserInDB(
            id=payload.submitterId,
            name=name,
            avatarColor=hash_name_to_color(name),
            isOnline=True,
        )

    if payload.reviewerId and payload.reviewerId in reviewers_db and reviewers_db[payload.reviewerId].isOnline:
        reviewer = reviewers_db[payload.reviewerId]
        reviewer.activeTasks += 1
    else:
        reviewer = assign_reviewer_round_robin()
    reviewer_id = reviewer.id if reviewer else None

    priority = payload.priority if payload.priority in VALID_PRIORITIES else 'medium'
    task = TaskInDB(
        id=task_id,
        title=payload.title,
        description=payload.description,
        repoUrl=payload.repoUrl,
        status='pending',
        priority=priority,
        createdAt=now,
        updatedAt=now,
        submitterId=payload.submitterId,
        reviewerId=reviewer_id,
    )
    tasks_db[task_id] = task
    public = task_to_public(task)

    await sio.emit('taskCreated', public)
    return public


@app.get('/api/tasks/{task_id}')
async def get_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(404, 'Task not found')
    return task_to_public(tasks_db[task_id])


@app.patch('/api/tasks/{task_id}/status')
async def update_task_status(task_id: str, payload: UpdateStatusPayload):
    if task_id not in tasks_db:
        raise HTTPException(404, 'Task not found')
    if payload.status not in STATUS_COLUMNS:
        raise HTTPException(400, f'Invalid status. Must be one of {STATUS_COLUMNS}')

    task = tasks_db[task_id]
    old_status = task.status
    task.status = payload.status
    task.updatedAt = now_iso()

    if old_status in ('pending', 'reviewing') and payload.status in ('approved', 'changes_needed') and task.reviewerId:
        r = reviewers_db.get(task.reviewerId)
        if r and r.activeTasks > 0:
            r.activeTasks -= 1
    if old_status in ('approved', 'changes_needed') and payload.status in ('pending', 'reviewing') and task.reviewerId:
        r = reviewers_db.get(task.reviewerId)
        if r:
            r.activeTasks += 1

    public = task_to_public(task)
    await sio.emit('statusChange', {
        'taskId': task.id,
        'status': task.status,
        'updatedAt': task.updatedAt,
        'task': public,
    })
    return public


@app.delete('/api/tasks/{task_id}', status_code=204)
async def delete_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(404, 'Task not found')
    task = tasks_db.pop(task_id)
    if task.reviewerId:
        r = reviewers_db.get(task.reviewerId)
        if r and r.activeTasks > 0 and task.status in ('pending', 'reviewing'):
            r.activeTasks -= 1
    await sio.emit('taskDeleted', {'taskId': task_id})
    return None


@app.post('/api/tasks/{task_id}/assign')
async def assign_reviewer(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(404, 'Task not found')
    task = tasks_db[task_id]
    if task.reviewerId:
        old = reviewers_db.get(task.reviewerId)
        if old and old.activeTasks > 0:
            old.activeTasks -= 1
    new_reviewer = assign_reviewer_round_robin()
    task.reviewerId = new_reviewer.id if new_reviewer else None
    task.updatedAt = now_iso()
    public = task_to_public(task)
    await sio.emit('statusChange', {
        'taskId': task.id,
        'status': task.status,
        'updatedAt': task.updatedAt,
        'task': public,
    })
    return new_reviewer.model_dump() if new_reviewer else None


@app.get('/api/reviewers')
async def list_reviewers():
    return [r.model_dump() for r in reviewers_db.values()]


@sio.event
async def connect(sid: str, environ: Any):
    print('[WS] connected:', sid)


@sio.event
async def disconnect(sid: str):
    print('[WS] disconnected:', sid)


@sio.event
async def ping(sid: str, data: Any):
    await sio.emit('pong', {'t': data.get('t') if isinstance(data, dict) else None}, to=sid)
    return True


socketio_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')


if __name__ == '__main__':
    uvicorn.run(socketio_app, host='0.0.0.0', port=8001)
