import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uuid
import time

from models import (
    NodeModel,
    EdgeModel,
    LoginRequest,
    LoginResponse,
    CreateMindMapRequest,
    MindMapResponse,
    MindMapData,
)
from socket_manager import socket_manager

app = FastAPI(title="协同思维导图 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socket_manager.get_sio()

mindmaps_db: dict = {}


def create_default_mindmap(mindmap_id: str, title: str) -> MindMapData:
    nodes = [
        NodeModel(
            id="node-1",
            title="中心主题",
            note="这是思维导图的中心节点",
            color="#ffffff",
            fontSize=18,
            x=400,
            y=300,
        ),
        NodeModel(
            id="node-2",
            title="分支一",
            note="第一个分支的备注信息",
            color="#eff6ff",
            fontSize=16,
            x=650,
            y=200,
        ),
        NodeModel(
            id="node-3",
            title="分支二",
            note="",
            color="#f0fdf4",
            fontSize=16,
            x=650,
            y=400,
        ),
    ]

    edges = [
        EdgeModel(id="e-1-2", source="node-1", target="node-2"),
        EdgeModel(id="e-1-3", source="node-1", target="node-3"),
    ]

    return MindMapData(
        id=mindmap_id,
        title=title,
        nodes=nodes,
        edges=edges,
    )


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    return LoginResponse(userId=user_id, username=request.username)


@app.post("/api/mindmap/create", response_model=MindMapResponse)
async def create_mindmap(request: CreateMindMapRequest):
    mindmap_id = f"mindmap-{uuid.uuid4().hex[:12]}"
    mindmap = create_default_mindmap(mindmap_id, request.title)
    mindmaps_db[mindmap_id] = mindmap
    return MindMapResponse(
        id=mindmap.id,
        title=mindmap.title,
        nodes=mindmap.nodes,
        edges=mindmap.edges,
    )


@app.get("/api/mindmap/{mindmap_id}", response_model=MindMapResponse)
async def get_mindmap(mindmap_id: str):
    if mindmap_id not in mindmaps_db:
        mindmap = create_default_mindmap(mindmap_id, "思维导图")
        mindmaps_db[mindmap_id] = mindmap

    mindmap = mindmaps_db[mindmap_id]
    return MindMapResponse(
        id=mindmap.id,
        title=mindmap.title,
        nodes=mindmap.nodes,
        edges=mindmap.edges,
    )


@sio.event
async def connect(sid, environ):
    await socket_manager.connect(sid, environ)


@sio.event
async def disconnect(sid):
    await socket_manager.disconnect(sid)


@sio.event
async def message(sid, data):
    await socket_manager.handle_message(sid, data)


socketio_app = socketio.ASGIApp(sio, other_asgi_app=app)


@app.get("/")
async def root():
    return {"message": "协同思维导图 API 服务运行中"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}


if __name__ == "__main__":
    uvicorn.run("main:socketio_app", host="0.0.0.0", port=8000, reload=True)
