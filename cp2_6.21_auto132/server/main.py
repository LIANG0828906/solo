import uuid
import json
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
combined_app = socketio.ASGIApp(sio, other_asgi_app=app)

USERS: dict = {}
PROJECTS: dict = {}
TASKS: dict = {}
TERMS: dict = {}

AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
]

def _uid() -> str:
    return str(uuid.uuid4())[:8]

def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"

def _seed():
    u1 = _uid()
    u2 = _uid()
    u3 = _uid()
    u4 = _uid()
    USERS[u1] = {"id": u1, "name": "Alice Wang", "avatar": AVATARS[0]}
    USERS[u2] = {"id": u2, "name": "Bob Li", "avatar": AVATARS[1]}
    USERS[u3] = {"id": u3, "name": "Carol Zhang", "avatar": AVATARS[2]}
    USERS[u4] = {"id": u4, "name": "David Chen", "avatar": AVATARS[3]}

    p1 = _uid()
    p2 = _uid()
    PROJECTS[p1] = {
        "id": p1,
        "name": "Mobile App Localization",
        "members": [
            {"userId": u1, "role": "manager"},
            {"userId": u2, "role": "translator"},
            {"userId": u3, "role": "reviewer"},
        ],
        "createdAt": _now(),
        "updatedAt": _now(),
    }
    PROJECTS[p2] = {
        "id": p2,
        "name": "Website Redesign i18n",
        "members": [
            {"userId": u1, "role": "translator"},
            {"userId": u4, "role": "manager"},
        ],
        "createdAt": _now(),
        "updatedAt": _now(),
    }

    statuses = ["unassigned", "translating", "reviewing", "completed"]
    titles = [
        ("Homepage Translation", "Translate homepage content to Chinese"),
        ("Settings Page", "Translate settings page UI strings"),
        ("Legal Notice", "Translate terms of service and privacy policy"),
        ("Error Messages", "Translate all error message strings"),
        ("Navigation Menu", "Translate navigation labels"),
        ("Onboarding Flow", "Translate onboarding wizard text"),
        ("Email Templates", "Translate transactional email templates"),
        ("API Docs", "Translate API documentation sections"),
    ]
    for i, (title, desc) in enumerate(titles):
        tid = _uid()
        pid = p1 if i < 5 else p2
        uid = [u2, u3, u2, u3, u1, u1, u4, u4][i]
        TASKS[tid] = {
            "id": tid,
            "projectId": pid,
            "title": title,
            "description": desc,
            "status": statuses[i % 4],
            "assigneeId": uid,
            "assigneeName": USERS[uid]["name"],
            "assigneeAvatar": USERS[uid]["avatar"],
            "dueDate": "2026-07-15",
            "createdAt": _now(),
        }

    sample_terms = [
        ("Dashboard", "仪表盘", "en", "zh", "UI label"),
        ("Settings", "设置", "en", "zh", "Menu item"),
        ("Submit", "提交", "en", "zh", "Button"),
        ("Cancel", "取消", "en", "zh", "Button"),
        ("Error", "错误", "en", "zh", ""),
        ("Warning", "警告", "en", "zh", "Alert type"),
        ("Upload", "上传", "en", "zh", "Action verb"),
        ("Download", "下载", "en", "zh", "Action verb"),
        ("Save", "保存", "en", "zh", "Button"),
        ("Delete", "删除", "en", "zh", "Destructive action"),
        ("Edit", "编辑", "en", "zh", "Action verb"),
        ("Search", "搜索", "en", "zh", "Input placeholder"),
        ("Filter", "筛选", "en", "zh", ""),
        ("Export", "导出", "en", "zh", "Action verb"),
        ("Import", "导入", "en", "zh", "Action verb"),
        ("ホームページ", "首页", "ja", "zh", "Navigation"),
        ("設定", "设置", "ja", "zh", "Menu item"),
        ("送信", "发送", "ja", "zh", "Button"),
    ]
    for src, tgt, sl, tl, notes in sample_terms:
        tid = _uid()
        TERMS[tid] = {
            "id": tid,
            "projectId": p1,
            "sourceTerm": src,
            "targetTerm": tgt,
            "sourceLang": sl,
            "targetLang": tl,
            "notes": notes,
            "updatedAt": _now(),
        }

_seed()

@app.get("/api/users")
def list_users():
    return list(USERS.values())

@app.post("/api/users")
def create_user(body: dict):
    name = body.get("name", "")
    if not name:
        raise HTTPException(400, "name required")
    uid = _uid()
    user = {"id": uid, "name": name, "avatar": AVATARS[len(USERS) % len(AVATARS)]}
    USERS[uid] = user
    for proj in PROJECTS.values():
        if not any(m["userId"] == uid for m in proj["members"]):
            proj["members"].append({"userId": uid, "role": "translator"})
    return user

@app.get("/api/projects")
def list_projects(userId: str = Query("")):
    result = []
    for p in PROJECTS.values():
        if not userId or any(m["userId"] == userId for m in p["members"]):
            total = sum(1 for t in TASKS.values() if t["projectId"] == p["id"])
            done = sum(1 for t in TASKS.values() if t["projectId"] == p["id"] and t["status"] == "completed")
            role = ""
            if userId:
                for m in p["members"]:
                    if m["userId"] == userId:
                        role = m["role"]
                        break
            result.append({**p, "totalTasks": total, "completedTasks": done, "role": role})
    return result

@app.post("/api/projects")
def create_project(body: dict):
    name = body.get("name", "")
    userId = body.get("userId", "")
    if not name or not userId:
        raise HTTPException(400, "name and userId required")
    pid = _uid()
    proj = {
        "id": pid,
        "name": name,
        "members": [{"userId": userId, "role": "manager"}],
        "createdAt": _now(),
        "updatedAt": _now(),
    }
    PROJECTS[pid] = proj
    return proj

@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    if project_id not in PROJECTS:
        raise HTTPException(404, "Project not found")
    return PROJECTS[project_id]

@app.get("/api/projects/{project_id}/tasks")
def list_tasks(project_id: str):
    return [t for t in TASKS.values() if t["projectId"] == project_id]

@app.post("/api/projects/{project_id}/tasks")
def create_task(project_id: str, body: dict):
    if project_id not in PROJECTS:
        raise HTTPException(404, "Project not found")
    tid = _uid()
    uid = body.get("assigneeId", "")
    user = USERS.get(uid, {})
    task = {
        "id": tid,
        "projectId": project_id,
        "title": body.get("title", "New Task"),
        "description": body.get("description", ""),
        "status": body.get("status", "unassigned"),
        "assigneeId": uid,
        "assigneeName": user.get("name", "Unassigned"),
        "assigneeAvatar": user.get("avatar", ""),
        "dueDate": body.get("dueDate", ""),
        "createdAt": _now(),
    }
    TASKS[tid] = task
    return task

@app.patch("/api/tasks/{task_id}")
async def update_task(task_id: str, body: dict):
    if task_id not in TASKS:
        raise HTTPException(404, "Task not found")
    task = TASKS[task_id]
    if "status" in body:
        task["status"] = body["status"]
    if "title" in body:
        task["title"] = body["title"]
    if "description" in body:
        task["description"] = body["description"]
    if "assigneeId" in body:
        uid = body["assigneeId"]
        user = USERS.get(uid, {})
        task["assigneeId"] = uid
        task["assigneeName"] = user.get("name", "Unassigned")
        task["assigneeAvatar"] = user.get("avatar", "")
    if "dueDate" in body:
        task["dueDate"] = body["dueDate"]
    await sio.emit("task_updated", task, room=task["projectId"])
    return task

@app.get("/api/projects/{project_id}/terms")
def list_terms(project_id: str):
    return [t for t in TERMS.values() if t["projectId"] == project_id]

@app.post("/api/projects/{project_id}/terms")
async def create_term(project_id: str, body: dict):
    if project_id not in PROJECTS:
        raise HTTPException(404, "Project not found")
    tid = _uid()
    term = {
        "id": tid,
        "projectId": project_id,
        "sourceTerm": body.get("sourceTerm", ""),
        "targetTerm": body.get("targetTerm", ""),
        "sourceLang": body.get("sourceLang", "en"),
        "targetLang": body.get("targetLang", "zh"),
        "notes": body.get("notes", ""),
        "updatedAt": _now(),
    }
    TERMS[tid] = term
    await sio.emit("term_updated", term, room=project_id)
    return term

@app.put("/api/terms/{term_id}")
async def update_term(term_id: str, body: dict):
    if term_id not in TERMS:
        raise HTTPException(404, "Term not found")
    term = TERMS[term_id]
    for key in ("sourceTerm", "targetTerm", "sourceLang", "targetLang", "notes"):
        if key in body:
            term[key] = body[key]
    term["updatedAt"] = _now()
    await sio.emit("term_updated", term, room=term["projectId"])
    return term

@app.delete("/api/terms/{term_id}")
async def delete_term(term_id: str):
    if term_id not in TERMS:
        raise HTTPException(404, "Term not found")
    term = TERMS.pop(term_id)
    await sio.emit("term_deleted", {"id": term_id}, room=term["projectId"])
    return {"ok": True}

@sio.event
async def connect(sid, environ):
    pass

@sio.event
async def disconnect(sid):
    pass

@sio.event
async def join_project(sid, data):
    project_id = data.get("projectId", "")
    if project_id:
        sio.enter_room(sid, project_id)

@sio.event
async def leave_project(sid, data):
    project_id = data.get("projectId", "")
    if project_id:
        sio.leave_room(sid, project_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(combined_app, host="0.0.0.0", port=8000)
