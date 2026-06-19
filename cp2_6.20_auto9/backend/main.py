import uuid
import asyncio
from datetime import datetime
from typing import Optional, List
from copy import deepcopy

from fastapi import FastAPI, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError
import socketio
import uvicorn

SECRET_KEY = "mindmap-collab-secret-2024"
ALGORITHM = "HS256"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app.mount("/socket.io", socketio.ASGIApp(sio))


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: str


class CanvasCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CanvasResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    members: List[str]
    created_at: str
    updated_at: str


class NodeCreate(BaseModel):
    id: Optional[str] = None
    text: str
    x: float = 0
    y: float = 0
    parent_id: Optional[str] = None
    color: Optional[str] = None
    collapsed: bool = False


class NodeUpdate(BaseModel):
    text: Optional[str] = None
    color: Optional[str] = None
    collapsed: Optional[bool] = None


class NodeMove(BaseModel):
    x: float
    y: float


class NodeResponse(BaseModel):
    id: str
    text: str
    x: float
    y: float
    parent_id: Optional[str]
    children: List[str]
    color: Optional[str]
    collapsed: bool
    created_at: str
    updated_at: str


class InviteRequest(BaseModel):
    email: str


class HistorySnapshot(BaseModel):
    id: str
    version: int
    name: str
    nodes: List[dict]
    created_at: str


class HistoryCreate(BaseModel):
    name: Optional[str] = None


class SearchResult(BaseModel):
    nodes: List[NodeResponse]
    query: str


users_db = {
    "user-1": {"id": "user-1", "name": "Demo User", "email": "demo@example.com", "avatar": "D"},
    "user-2": {"id": "user-2", "name": "Alice", "email": "alice@example.com", "avatar": "A"},
    "user-3": {"id": "user-3", "name": "Bob", "email": "bob@example.com", "avatar": "B"},
}

canvases_db = {}
nodes_db = {}
history_db = {}
online_users = {}


def _ts():
    return datetime.utcnow().isoformat() + "Z"


def _create_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id}, SECRET_KEY, algorithm=ALGORITHM)


def _get_user_id(authorization: str = Header(default=None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = jwt.decode(authorization[7:], SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("sub", "user-1")
        except JWTError:
            pass
    return "user-1"


def _seed_data():
    now = _ts()

    c1 = str(uuid.uuid4())
    c2 = str(uuid.uuid4())
    c3 = str(uuid.uuid4())

    canvases_db[c1] = {
        "id": c1, "name": "Project Planning", "description": "Q3 project roadmap and milestones",
        "owner_id": "user-1", "members": ["user-1", "user-2"],
        "created_at": now, "updated_at": now,
    }
    canvases_db[c2] = {
        "id": c2, "name": "Brainstorm: Product Ideas", "description": "New feature brainstorm session",
        "owner_id": "user-1", "members": ["user-1"],
        "created_at": now, "updated_at": now,
    }
    canvases_db[c3] = {
        "id": c3, "name": "Study Notes: Machine Learning", "description": "ML course study notes",
        "owner_id": "user-2", "members": ["user-2", "user-1", "user-3"],
        "created_at": now, "updated_at": now,
    }

    r1 = str(uuid.uuid4())
    r1a = str(uuid.uuid4())
    r1b = str(uuid.uuid4())
    r1a1 = str(uuid.uuid4())
    r1a2 = str(uuid.uuid4())
    r1b1 = str(uuid.uuid4())

    nodes_db[c1] = {
        r1: {"id": r1, "text": "Project Roadmap", "x": 400, "y": 300, "parent_id": None, "children": [r1a, r1b], "color": "#6366f1", "collapsed": False, "created_at": now, "updated_at": now},
        r1a: {"id": r1a, "text": "Frontend", "x": 200, "y": 150, "parent_id": r1, "children": [r1a1, r1a2], "color": "#22c55e", "collapsed": False, "created_at": now, "updated_at": now},
        r1b: {"id": r1b, "text": "Backend", "x": 600, "y": 150, "parent_id": r1, "children": [r1b1], "color": "#f59e0b", "collapsed": False, "created_at": now, "updated_at": now},
        r1a1: {"id": r1a1, "text": "React Components", "x": 50, "y": 50, "parent_id": r1a, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
        r1a2: {"id": r1a2, "text": "State Management", "x": 200, "y": 50, "parent_id": r1a, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
        r1b1: {"id": r1b1, "text": "API Design", "x": 550, "y": 50, "parent_id": r1b, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
    }

    r2 = str(uuid.uuid4())
    r2a = str(uuid.uuid4())
    r2b = str(uuid.uuid4())
    r2c = str(uuid.uuid4())
    r2a1 = str(uuid.uuid4())

    nodes_db[c2] = {
        r2: {"id": r2, "text": "Product Ideas", "x": 400, "y": 300, "parent_id": None, "children": [r2a, r2b, r2c], "color": "#ec4899", "collapsed": False, "created_at": now, "updated_at": now},
        r2a: {"id": r2a, "text": "AI Features", "x": 200, "y": 150, "parent_id": r2, "children": [r2a1], "color": "#8b5cf6", "collapsed": False, "created_at": now, "updated_at": now},
        r2b: {"id": r2b, "text": "Collaboration", "x": 400, "y": 150, "parent_id": r2, "children": [], "color": "#06b6d4", "collapsed": False, "created_at": now, "updated_at": now},
        r2c: {"id": r2c, "text": "Analytics", "x": 600, "y": 150, "parent_id": r2, "children": [], "color": "#f97316", "collapsed": False, "created_at": now, "updated_at": now},
        r2a1: {"id": r2a1, "text": "Smart Suggestions", "x": 100, "y": 50, "parent_id": r2a, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
    }

    r3 = str(uuid.uuid4())
    r3a = str(uuid.uuid4())
    r3b = str(uuid.uuid4())
    r3a1 = str(uuid.uuid4())
    r3a2 = str(uuid.uuid4())
    r3b1 = str(uuid.uuid4())
    r3b2 = str(uuid.uuid4())

    nodes_db[c3] = {
        r3: {"id": r3, "text": "Machine Learning", "x": 400, "y": 300, "parent_id": None, "children": [r3a, r3b], "color": "#10b981", "collapsed": False, "created_at": now, "updated_at": now},
        r3a: {"id": r3a, "text": "Supervised Learning", "x": 200, "y": 150, "parent_id": r3, "children": [r3a1, r3a2], "color": "#3b82f6", "collapsed": False, "created_at": now, "updated_at": now},
        r3b: {"id": r3b, "text": "Unsupervised Learning", "x": 600, "y": 150, "parent_id": r3, "children": [r3b1, r3b2], "color": "#ef4444", "collapsed": False, "created_at": now, "updated_at": now},
        r3a1: {"id": r3a1, "text": "Classification", "x": 100, "y": 50, "parent_id": r3a, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
        r3a2: {"id": r3a2, "text": "Regression", "x": 250, "y": 50, "parent_id": r3a, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
        r3b1: {"id": r3b1, "text": "Clustering", "x": 500, "y": 50, "parent_id": r3b, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
        r3b2: {"id": r3b2, "text": "Dimensionality Reduction", "x": 700, "y": 50, "parent_id": r3b, "children": [], "color": None, "collapsed": False, "created_at": now, "updated_at": now},
    }

    for cid in [c1, c2, c3]:
        history_db[cid] = []
        online_users[cid] = {}


_seed_data()


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    for u in users_db.values():
        if u["email"] == body.email:
            token = _create_token(u["id"])
            return AuthResponse(user=UserResponse(**u), token=token)
    new_id = str(uuid.uuid4())
    user = {"id": new_id, "name": body.email.split("@")[0], "email": body.email, "avatar": body.email[0].upper()}
    users_db[new_id] = user
    token = _create_token(new_id)
    return AuthResponse(user=UserResponse(**user), token=token)


@app.post("/api/auth/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    new_id = str(uuid.uuid4())
    user = {"id": new_id, "name": body.name, "email": body.email, "avatar": body.name[0].upper()}
    users_db[new_id] = user
    token = _create_token(new_id)
    return AuthResponse(user=UserResponse(**user), token=token)


@app.get("/api/canvases", response_model=List[CanvasResponse])
async def list_canvases(user_id: str = Depends(_get_user_id)):
    return [CanvasResponse(**c) for c in canvases_db.values() if user_id in c["members"]]


@app.post("/api/canvases", response_model=CanvasResponse, status_code=201)
async def create_canvas(body: CanvasCreate, user_id: str = Depends(_get_user_id)):
    now = _ts()
    cid = str(uuid.uuid4())
    canvas = {
        "id": cid, "name": body.name, "description": body.description,
        "owner_id": user_id, "members": [user_id],
        "created_at": now, "updated_at": now,
    }
    canvases_db[cid] = canvas
    nodes_db[cid] = {}
    history_db[cid] = []
    online_users[cid] = {}
    root_id = str(uuid.uuid4())
    nodes_db[cid][root_id] = {
        "id": root_id, "text": body.name, "x": 400, "y": 300,
        "parent_id": None, "children": [], "color": "#6366f1",
        "collapsed": False, "created_at": now, "updated_at": now,
    }
    return CanvasResponse(**canvas)


@app.delete("/api/canvases/{canvas_id}", status_code=204)
async def delete_canvas(canvas_id: str, user_id: str = Depends(_get_user_id)):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    if canvases_db[canvas_id]["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only owner can delete")
    del canvases_db[canvas_id]
    nodes_db.pop(canvas_id, None)
    history_db.pop(canvas_id, None)
    online_users.pop(canvas_id, None)


@app.get("/api/canvases/{canvas_id}/nodes", response_model=List[NodeResponse])
async def get_nodes(canvas_id: str):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return [NodeResponse(**n) for n in nodes_db.get(canvas_id, {}).values()]


@app.post("/api/canvases/{canvas_id}/invite")
async def invite_member(canvas_id: str, body: InviteRequest, user_id: str = Depends(_get_user_id)):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    for u in users_db.values():
        if u["email"] == body.email:
            if u["id"] not in canvases_db[canvas_id]["members"]:
                canvases_db[canvas_id]["members"].append(u["id"])
            return {"message": f"Invited {body.email}"}
    new_id = str(uuid.uuid4())
    user = {"id": new_id, "name": body.email.split("@")[0], "email": body.email, "avatar": body.email[0].upper()}
    users_db[new_id] = user
    canvases_db[canvas_id]["members"].append(new_id)
    return {"message": f"Invited {body.email}"}


@app.get("/api/canvases/{canvas_id}/history", response_model=List[HistorySnapshot])
async def get_history(canvas_id: str):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return history_db.get(canvas_id, [])


@app.post("/api/canvases/{canvas_id}/history", response_model=HistorySnapshot, status_code=201)
async def save_snapshot(canvas_id: str, body: HistoryCreate = None):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    snapshots = history_db.setdefault(canvas_id, [])
    version = len(snapshots) + 1
    snap_id = str(uuid.uuid4())
    now = _ts()
    snapshot = {
        "id": snap_id,
        "version": version,
        "name": body.name if body and body.name else f"Version {version}",
        "nodes": list(nodes_db.get(canvas_id, {}).values()),
        "created_at": now,
    }
    snapshots.append(snapshot)
    return HistorySnapshot(**snapshot)


@app.post("/api/canvases/{canvas_id}/history/{version_id}/restore")
async def restore_version(canvas_id: str, version_id: str):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    snapshots = history_db.get(canvas_id, [])
    snap = None
    for s in snapshots:
        if s["id"] == version_id:
            snap = s
            break
    if not snap:
        raise HTTPException(status_code=404, detail="Version not found")
    restored = {n["id"]: deepcopy(n) for n in snap["nodes"]}
    nodes_db[canvas_id] = restored
    canvases_db[canvas_id]["updated_at"] = _ts()
    await sio.emit("version:restore", {"nodes": snap["nodes"], "version_id": version_id}, room=canvas_id)
    return {"message": "Version restored", "version_id": version_id}


@app.get("/api/canvases/{canvas_id}/search", response_model=SearchResult)
async def search_nodes(canvas_id: str, q: str = Query(default="")):
    if canvas_id not in canvases_db:
        raise HTTPException(status_code=404, detail="Canvas not found")
    results = []
    q_lower = q.lower()
    for n in nodes_db.get(canvas_id, {}).values():
        if q_lower in n["text"].lower():
            results.append(NodeResponse(**n))
    return SearchResult(nodes=results, query=q)


@sio.event
async def connect(sid, environ):
    qs = environ.get("QUERY_STRING", "")
    canvas_id = None
    for pair in qs.split("&"):
        if pair.startswith("canvas_id="):
            canvas_id = pair.split("=", 1)[1]
            break
    if canvas_id and canvas_id in canvases_db:
        sio.enter_room(sid, canvas_id)
        online_users.setdefault(canvas_id, {})[sid] = {"sid": sid, "user_id": None, "name": None, "color": None}
        await sio.emit("user:joined", {"sid": sid, "online_count": len(online_users[canvas_id])}, room=canvas_id)


@sio.event
async def disconnect(sid):
    for canvas_id, users in list(online_users.items()):
        if sid in users:
            del users[sid]
            sio.leave_room(sid, canvas_id)
            await sio.emit("user:left", {"sid": sid, "online_count": len(users)}, room=canvas_id)
            break


@sio.event
async def node_create(sid, data):
    canvas_id = data.get("canvas_id")
    if not canvas_id or canvas_id not in canvases_db:
        return
    node = data.get("node", {})
    node_id = node.get("id", str(uuid.uuid4()))
    now = _ts()
    parent_id = node.get("parent_id")
    new_node = {
        "id": node_id, "text": node.get("text", "New Node"),
        "x": node.get("x", 0), "y": node.get("y", 0),
        "parent_id": parent_id, "children": node.get("children", []),
        "color": node.get("color"), "collapsed": node.get("collapsed", False),
        "created_at": now, "updated_at": now,
    }
    nodes_db.setdefault(canvas_id, {})[node_id] = new_node
    if parent_id and parent_id in nodes_db[canvas_id]:
        if node_id not in nodes_db[canvas_id][parent_id]["children"]:
            nodes_db[canvas_id][parent_id]["children"].append(node_id)
    await sio.emit("node:created", new_node, room=canvas_id, skip_sid=sid)


@sio.event
async def node_update(sid, data):
    canvas_id = data.get("canvas_id")
    node_id = data.get("node_id")
    if not canvas_id or canvas_id not in canvases_db:
        return
    nodes = nodes_db.get(canvas_id, {})
    if node_id not in nodes:
        return
    updates = data.get("updates", {})
    for k, v in updates.items():
        if k in nodes[node_id]:
            nodes[node_id][k] = v
    nodes[node_id]["updated_at"] = _ts()
    await sio.emit("node:updated", {"node_id": node_id, "updates": updates}, room=canvas_id, skip_sid=sid)


@sio.event
async def node_delete(sid, data):
    canvas_id = data.get("canvas_id")
    node_id = data.get("node_id")
    if not canvas_id or canvas_id not in canvases_db:
        return
    nodes = nodes_db.get(canvas_id, {})
    if node_id not in nodes:
        return
    node = nodes[node_id]
    if node["parent_id"] and node["parent_id"] in nodes:
        parent = nodes[node["parent_id"]]
        if node_id in parent["children"]:
            parent["children"].remove(node_id)

    def _collect_descendants(nid):
        desc = [nid]
        for child_id in nodes.get(nid, {}).get("children", []):
            desc.extend(_collect_descendants(child_id))
        return desc

    for did in _collect_descendants(node_id):
        nodes.pop(did, None)
    await sio.emit("node:deleted", {"node_id": node_id}, room=canvas_id, skip_sid=sid)


@sio.event
async def node_move(sid, data):
    canvas_id = data.get("canvas_id")
    node_id = data.get("node_id")
    if not canvas_id or canvas_id not in canvases_db:
        return
    nodes = nodes_db.get(canvas_id, {})
    if node_id not in nodes:
        return
    nodes[node_id]["x"] = data.get("x", nodes[node_id]["x"])
    nodes[node_id]["y"] = data.get("y", nodes[node_id]["y"])
    nodes[node_id]["updated_at"] = _ts()
    await sio.emit("node:moved", {"node_id": node_id, "x": nodes[node_id]["x"], "y": nodes[node_id]["y"]}, room=canvas_id, skip_sid=sid)


@sio.event
async def version_restore(sid, data):
    canvas_id = data.get("canvas_id")
    version_id = data.get("version_id")
    if not canvas_id or canvas_id not in canvases_db:
        return
    snapshots = history_db.get(canvas_id, [])
    snap = None
    for s in snapshots:
        if s["id"] == version_id:
            snap = s
            break
    if not snap:
        return
    restored = {n["id"]: deepcopy(n) for n in snap["nodes"]}
    nodes_db[canvas_id] = restored
    canvases_db[canvas_id]["updated_at"] = _ts()
    await sio.emit("version:restored", {"nodes": snap["nodes"], "version_id": version_id}, room=canvas_id)


@sio.event
async def user_editing(sid, data):
    canvas_id = data.get("canvas_id")
    if not canvas_id or canvas_id not in canvases_db:
        return
    users = online_users.get(canvas_id, {})
    if sid in users:
        users[sid].update({
            "user_id": data.get("user_id"),
            "name": data.get("name"),
            "color": data.get("color"),
        })
    await sio.emit("user:editing", {
        "sid": sid, "node_id": data.get("node_id"),
        "user_id": data.get("user_id"), "name": data.get("name"),
        "color": data.get("color"), "is_editing": data.get("is_editing", True),
    }, room=canvas_id, skip_sid=sid)


async def _auto_save():
    while True:
        await asyncio.sleep(300)
        for canvas_id, canvas in list(canvases_db.items()):
            snapshots = history_db.setdefault(canvas_id, [])
            version = len(snapshots) + 1
            snap_id = str(uuid.uuid4())
            now = _ts()
            snapshot = {
                "id": snap_id, "version": version,
                "name": f"Auto-save {version}",
                "nodes": list(nodes_db.get(canvas_id, {}).values()),
                "created_at": now,
            }
            snapshots.append(snapshot)
            canvas["updated_at"] = now


@app.on_event("startup")
async def startup():
    asyncio.create_task(_auto_save())


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
