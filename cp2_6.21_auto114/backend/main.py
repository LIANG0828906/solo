from __future__ import annotations

import json
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from models import (
    AvatarCrop,
    Node,
    NodeCreate,
    Relation,
    RelationCreate,
    FamilyTree,
    FamilyTreeCreate,
    FamilyTreeUpdate,
    FamilyTreeSummary,
    FamilyTreeStats,
    ShareInfo,
    SuccessResponse,
    Collaborator,
)


MAX_COLLABORATORS = 5
SHARE_TOKEN_TTL = timedelta(days=7)


class InMemoryStorage:
    def __init__(self) -> None:
        self.trees: Dict[str, FamilyTree] = {}
        self.share_tokens: Dict[str, tuple[str, datetime]] = {}
        self.reverse_share: Dict[str, str] = {}


storage = InMemoryStorage()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.collaborators: Dict[str, Dict[str, Collaborator]] = {}

    async def connect(
        self,
        tree_id: str,
        user_id: str,
        username: str,
        color: str,
        websocket: WebSocket,
    ) -> None:
        if tree_id not in self.active_connections:
            self.active_connections[tree_id] = {}
            self.collaborators[tree_id] = {}

        if len(self.active_connections[tree_id]) >= MAX_COLLABORATORS:
            raise HTTPException(status_code=403, detail="最多支持5人同时编辑")

        if user_id in self.active_connections[tree_id]:
            try:
                await self.active_connections[tree_id][user_id].close()
            except Exception:
                pass

        self.active_connections[tree_id][user_id] = websocket
        self.collaborators[tree_id][user_id] = Collaborator(
            id=user_id,
            username=username,
            color=color,
        )

        await self.broadcast(
            tree_id,
            {
                "type": "user_joined",
                "userId": user_id,
                "username": username,
                "color": color,
            },
            exclude_user=user_id,
        )

        users_list = [
            {
                "id": c.id,
                "username": c.username,
                "color": c.color,
            }
            for c in self.collaborators[tree_id].values()
        ]
        await self.send_personal(
            tree_id,
            user_id,
            {"type": "users_list", "users": users_list},
        )

    async def disconnect(self, tree_id: str, user_id: str) -> None:
        if tree_id in self.active_connections:
            self.active_connections[tree_id].pop(user_id, None)
            self.collaborators[tree_id].pop(user_id, None)
            if not self.active_connections[tree_id]:
                self.active_connections.pop(tree_id, None)
                self.collaborators.pop(tree_id, None)
            else:
                await self.broadcast(
                    tree_id,
                    {"type": "user_left", "userId": user_id},
                )

    async def broadcast(self, tree_id: str, message: dict, exclude_user: Optional[str] = None) -> None:
        if tree_id not in self.active_connections:
            return
        for uid, ws in list(self.active_connections[tree_id].items()):
            if uid == exclude_user:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def send_personal(self, tree_id: str, user_id: str, message: dict) -> None:
        if tree_id not in self.active_connections:
            return
        ws = self.active_connections[tree_id].get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                pass

    def update_cursor(self, tree_id: str, user_id: str, x: float, y: float) -> None:
        if tree_id in self.collaborators and user_id in self.collaborators[tree_id]:
            self.collaborators[tree_id][user_id].cursor_x = x
            self.collaborators[tree_id][user_id].cursor_y = y
            self.collaborators[tree_id][user_id].last_active = datetime.utcnow()


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    demo_tree = create_demo_tree()
    storage.trees[demo_tree.id] = demo_tree
    yield


def create_demo_tree() -> FamilyTree:
    tree_id = f"demo-{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow()
    ancestor = Node(
        id="n-ancestor",
        tree_id=tree_id,
        name="祖先",
        photo_url=None,
        avatar_crop=None,
        generation=0,
        is_collapsed=False,
        parent_ids=[],
        children_ids=["n-son1", "n-son2"],
    )
    son1 = Node(
        id="n-son1",
        tree_id=tree_id,
        name="长子",
        photo_url=None,
        avatar_crop=None,
        generation=1,
        is_collapsed=False,
        parent_ids=["n-ancestor"],
        children_ids=["n-grandson1"],
    )
    son2 = Node(
        id="n-son2",
        tree_id=tree_id,
        name="次子",
        photo_url=None,
        avatar_crop=None,
        generation=1,
        is_collapsed=False,
        parent_ids=["n-ancestor"],
        children_ids=[],
    )
    grandson1 = Node(
        id="n-grandson1",
        tree_id=tree_id,
        name="长孙",
        photo_url=None,
        avatar_crop=None,
        generation=2,
        is_collapsed=False,
        parent_ids=["n-son1"],
        children_ids=[],
    )
    rel1 = Relation(
        id="r-1",
        tree_id=tree_id,
        from_node_id="n-ancestor",
        to_node_id="n-son1",
        type="blood",
        label="长子",
    )
    rel2 = Relation(
        id="r-2",
        tree_id=tree_id,
        from_node_id="n-ancestor",
        to_node_id="n-son2",
        type="blood",
        label="次子",
    )
    rel3 = Relation(
        id="r-3",
        tree_id=tree_id,
        from_node_id="n-son1",
        to_node_id="n-grandson1",
        type="blood",
        label="长子",
    )
    return FamilyTree(
        id=tree_id,
        name="示例家谱",
        created_at=now,
        updated_at=now,
        nodes=[ancestor, son1, son2, grandson1],
        relations=[rel1, rel2, rel3],
    )


app = FastAPI(title="Family Tree API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def compute_stats(tree: FamilyTree) -> FamilyTreeStats:
    if not tree.nodes:
        return FamilyTreeStats(totalMembers=0, generations=0)
    max_gen = max(n.generation for n in tree.nodes)
    return FamilyTreeStats(
        totalMembers=len(tree.nodes),
        generations=max_gen + 1,
    )


def generate_share_token() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex[:8]


@app.get("/")
def root():
    return {
        "service": "Family Tree API",
        "version": "1.0.0",
        "endpoints": {
            "list_trees": "GET /api/family-trees",
            "create_tree": "POST /api/family-trees",
            "get_tree": "GET /api/family-trees/{id}",
            "update_tree": "PUT /api/family-trees/{id}",
            "delete_tree": "DELETE /api/family-trees/{id}",
            "generate_share": "GET /api/family-trees/{id}/share",
            "get_shared": "GET /api/share/{token}",
            "export": "GET /api/family-trees/{id}/export",
            "collab_ws": "WS /ws/family-trees/{treeId}?user=&uid=&color=",
        },
    }


@app.get("/api/family-trees", response_model=List[FamilyTreeSummary])
def list_trees():
    return [
        FamilyTreeSummary(
            id=t.id,
            name=t.name,
            createdAt=t.created_at,
        )
        for t in sorted(storage.trees.values(), key=lambda x: x.updated_at, reverse=True)
    ]


@app.post("/api/family-trees", response_model=FamilyTreeSummary, status_code=201)
def create_tree(payload: FamilyTreeCreate):
    tree_id = f"tree-{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow()
    nodes = [
        Node(**n.model_dump(by_alias=True), tree_id=tree_id) for n in payload.nodes
    ]
    relations = [
        Relation(**r.model_dump(by_alias=True), tree_id=tree_id)
        for r in payload.relations
    ]
    tree = FamilyTree(
        id=tree_id,
        name=payload.name,
        created_at=now,
        updated_at=now,
        nodes=nodes,
        relations=relations,
    )
    storage.trees[tree_id] = tree
    return FamilyTreeSummary(id=tree.id, name=tree.name, createdAt=tree.created_at)


@app.get("/api/family-trees/{tree_id}", response_model=FamilyTree)
def get_tree(tree_id: str):
    tree = storage.trees.get(tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="家谱不存在")
    return tree


@app.put("/api/family-trees/{tree_id}", response_model=SuccessResponse)
def update_tree(tree_id: str, payload: FamilyTreeUpdate):
    tree = storage.trees.get(tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="家谱不存在")
    tree.updated_at = datetime.utcnow()
    if payload.name is not None:
        tree.name = payload.name
    if payload.nodes is not None:
        tree.nodes = [
            Node(**n.model_dump(by_alias=True), tree_id=tree_id) for n in payload.nodes
        ]
    if payload.relations is not None:
        tree.relations = [
            Relation(**r.model_dump(by_alias=True), tree_id=tree_id)
            for r in payload.relations
        ]
    return SuccessResponse(success=True)


@app.delete("/api/family-trees/{tree_id}", response_model=SuccessResponse)
def delete_tree(tree_id: str):
    if tree_id not in storage.trees:
        raise HTTPException(status_code=404, detail="家谱不存在")
    del storage.trees[tree_id]
    token = storage.reverse_share.pop(tree_id, None)
    if token:
        storage.share_tokens.pop(token, None)
    return SuccessResponse(success=True)


@app.get("/api/family-trees/{tree_id}/share", response_model=ShareInfo)
def generate_share(tree_id: str, request=None):
    tree = storage.trees.get(tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="家谱不存在")
    existing_token = storage.reverse_share.get(tree_id)
    if existing_token and existing_token in storage.share_tokens:
        token = existing_token
        tree_id_stored, _ = storage.share_tokens[token]
        if tree_id_stored != tree_id:
            token = None
    if not existing_token or existing_token not in storage.share_tokens:
        token = generate_share_token()
        storage.share_tokens[token] = (tree_id, datetime.utcnow() + SHARE_TOKEN_TTL)
        storage.reverse_share[tree_id] = token
    else:
        token = existing_token
    from starlette.requests import Request as _R
    share_url = f"/#share={token}"
    return ShareInfo(
        share_url=share_url,
        stats=compute_stats(tree),
    )


@app.get("/api/share/{token}", response_model=FamilyTree)
def get_shared_tree(token: str):
    if token not in storage.share_tokens:
        raise HTTPException(status_code=404, detail="分享链接无效或已过期")
    tree_id, expires_at = storage.share_tokens[token]
    if datetime.utcnow() > expires_at:
        del storage.share_tokens[token]
        storage.reverse_share.pop(tree_id, None)
        raise HTTPException(status_code=404, detail="分享链接已过期")
    tree = storage.trees.get(tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="家谱不存在")
    return tree


@app.get("/api/family-trees/{tree_id}/export")
def export_tree(tree_id: str):
    tree = storage.trees.get(tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="家谱不存在")
    data = {
        "version": "1.0.0",
        "exportedAt": datetime.utcnow().isoformat(),
        "name": tree.name,
        "nodes": [json.loads(n.model_dump_json(by_alias=True)) for n in tree.nodes],
        "relations": [json.loads(r.model_dump_json(by_alias=True)) for r in tree.relations],
        "stats": compute_stats(tree).model_dump(by_alias=True),
    }
    filename = f"{tree.name or 'family-tree'}.json"
    safe_name = filename.encode('utf-8', 'replace').decode('utf-8')
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}",
        },
    )


@app.websocket("/ws/family-trees/{tree_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    tree_id: str,
    user: str = Query(..., alias="user"),
    uid: str = Query(..., alias="uid"),
    color: str = Query("#e74c3c", alias="color"),
):
    await websocket.accept()
    if tree_id not in storage.trees:
        await websocket.send_json({"type": "error", "message": "家谱不存在"})
        await websocket.close()
        return
    try:
        await manager.connect(tree_id, uid, user, color, websocket)
    except HTTPException as e:
        await websocket.send_json({"type": "error", "message": e.detail})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except Exception:
                continue
            msg_type = message.get("type")

            if msg_type == "cursor_update":
                try:
                    x = float(message.get("x", 0))
                    y = float(message.get("y", 0))
                except (TypeError, ValueError):
                    continue
                manager.update_cursor(tree_id, uid, x, y)
                await manager.broadcast(
                    tree_id,
                    {"type": "cursor_update", "userId": uid, "x": x, "y": y},
                    exclude_user=uid,
                )

            elif msg_type == "node_added":
                node_data = message.get("node")
                if not node_data:
                    continue
                if tree_id in storage.trees:
                    try:
                        new_node = Node(**node_data, tree_id=tree_id)
                        existing = next(
                            (n for n in storage.trees[tree_id].nodes if n.id == new_node.id),
                            None,
                        )
                        if not existing:
                            storage.trees[tree_id].nodes.append(new_node)
                            storage.trees[tree_id].updated_at = datetime.utcnow()
                    except Exception:
                        pass
                await manager.broadcast(tree_id, message, exclude_user=uid)

            elif msg_type == "node_updated":
                node_id = message.get("nodeId")
                changes = message.get("changes") or {}
                if tree_id in storage.trees and node_id:
                    for n in storage.trees[tree_id].nodes:
                        if n.id == node_id:
                            for k, v in changes.items():
                                snake = k
                                if hasattr(n, snake):
                                    setattr(n, snake, v)
                            storage.trees[tree_id].updated_at = datetime.utcnow()
                            break
                await manager.broadcast(tree_id, message, exclude_user=uid)

            elif msg_type == "node_deleted":
                node_id = message.get("nodeId")
                if tree_id in storage.trees and node_id:
                    storage.trees[tree_id].nodes = [
                        n for n in storage.trees[tree_id].nodes if n.id != node_id
                    ]
                    storage.trees[tree_id].relations = [
                        r
                        for r in storage.trees[tree_id].relations
                        if r.from_node_id != node_id and r.to_node_id != node_id
                    ]
                    storage.trees[tree_id].updated_at = datetime.utcnow()
                await manager.broadcast(tree_id, message, exclude_user=uid)

            elif msg_type == "relation_added":
                rel_data = message.get("relation")
                if not rel_data:
                    continue
                if tree_id in storage.trees:
                    try:
                        new_rel = Relation(**rel_data, tree_id=tree_id)
                        existing = next(
                            (
                                r
                                for r in storage.trees[tree_id].relations
                                if r.id == new_rel.id
                            ),
                            None,
                        )
                        if not existing:
                            storage.trees[tree_id].relations.append(new_rel)
                            storage.trees[tree_id].updated_at = datetime.utcnow()
                    except Exception:
                        pass
                await manager.broadcast(tree_id, message, exclude_user=uid)

            elif msg_type == "relation_deleted":
                rel_id = message.get("relationId")
                if tree_id in storage.trees and rel_id:
                    storage.trees[tree_id].relations = [
                        r for r in storage.trees[tree_id].relations if r.id != rel_id
                    ]
                    storage.trees[tree_id].updated_at = datetime.utcnow()
                await manager.broadcast(tree_id, message, exclude_user=uid)

            elif msg_type == "hello":
                users_list = [
                    {
                        "id": c.id,
                        "username": c.username,
                        "color": c.color,
                    }
                    for c in manager.collaborators.get(tree_id, {}).values()
                ]
                await manager.send_personal(
                    tree_id,
                    uid,
                    {"type": "users_list", "users": users_list},
                )

    except WebSocketDisconnect:
        await manager.disconnect(tree_id, uid)
    except Exception:
        await manager.disconnect(tree_id, uid)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
