import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse

app = FastAPI(title="NarrativeForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Dialogue(BaseModel):
    id: str
    characterId: str
    text: str


class BranchCondition(BaseModel):
    type: str
    targetNodeId: Optional[str] = None
    itemId: Optional[str] = None
    itemName: Optional[str] = None


class StoryNode(BaseModel):
    id: str
    title: str
    description: str
    dialogues: List[Dialogue] = []
    position: Dict[str, float]
    createdAt: float
    updatedAt: float


class StoryEdge(BaseModel):
    id: str
    sourceId: str
    targetId: str
    condition: BranchCondition
    createdAt: float


class Character(BaseModel):
    id: str
    name: str
    avatar: str
    color: str


class CharacterRelation(BaseModel):
    id: str
    sourceId: str
    targetId: str
    type: str


class User(BaseModel):
    id: str
    name: str
    avatar: str
    color: str


class StoryVersion(BaseModel):
    id: str
    version: int
    createdAt: float
    creator: User
    nodes: List[StoryNode]
    edges: List[StoryEdge]
    characters: List[Character]
    relations: List[CharacterRelation]


class CollaboratorCursor(BaseModel):
    userId: str
    userName: str
    color: str
    x: float
    y: float


class CreateStoryRequest(BaseModel):
    title: str
    description: Optional[str] = ""


class CreateNodeRequest(BaseModel):
    title: str
    description: str
    dialogues: List[Dialogue] = []
    position: Dict[str, float]


class CreateEdgeRequest(BaseModel):
    sourceId: str
    targetId: str
    condition: BranchCondition


class CreateCharacterRequest(BaseModel):
    name: str
    avatar: str
    color: str


class CreateRelationRequest(BaseModel):
    sourceId: str
    targetId: str
    type: str


class SimulateRequest(BaseModel):
    startNodeId: str


class WSMessage(BaseModel):
    type: str
    payload: Any


class StoryData:
    def __init__(self):
        self.nodes: Dict[str, StoryNode] = {}
        self.edges: Dict[str, StoryEdge] = {}
        self.characters: Dict[str, Character] = {}
        self.relations: Dict[str, CharacterRelation] = {}
        self.versions: List[StoryVersion] = []
        self.createdAt: float = datetime.now().timestamp()
        self.updatedAt: float = datetime.now().timestamp()


stories: Dict[str, StoryData] = {}
connections: Dict[str, List[WebSocket]] = {}

now_ts = datetime.now().timestamp()
sample_story = StoryData()
sample_story.nodes = {
    "node-a": StoryNode(
        id="node-a",
        title="序章：神秘来信",
        description="主角在一个阴雨连绵的早晨收到了一封没有署名的信件",
        dialogues=[Dialogue(id="d1", characterId="char-1", text="这封信...是从哪里寄来的？")],
        position={"x": 100, "y": 150},
        createdAt=now_ts,
        updatedAt=now_ts,
    ),
    "node-b": StoryNode(
        id="node-b",
        title="前往古堡",
        description="按照信中的指引，主角来到了郊外的一座废弃古堡",
        dialogues=[Dialogue(id="d2", characterId="char-2", text="欢迎来到我的宅邸。")],
        position={"x": 500, "y": 80},
        createdAt=now_ts,
        updatedAt=now_ts,
    ),
    "node-c": StoryNode(
        id="node-c",
        title="求助警方",
        description="主角决定前往警察局寻求帮助",
        dialogues=[Dialogue(id="d3", characterId="char-3", text="这种恶作剧信件我们每周都收到。")],
        position={"x": 500, "y": 280},
        createdAt=now_ts,
        updatedAt=now_ts,
    ),
    "node-d": StoryNode(
        id="node-d",
        title="真相揭露",
        description="主角发现了隐藏已久的家族秘密和传说中的宝藏",
        dialogues=[Dialogue(id="d4", characterId="char-2", text="你已经知道了一切。")],
        position={"x": 900, "y": 150},
        createdAt=now_ts,
        updatedAt=now_ts,
    ),
}
sample_story.edges = {
    "edge-1": StoryEdge(
        id="edge-1",
        sourceId="node-a",
        targetId="node-b",
        condition=BranchCondition(type="has_item", itemId="letter", itemName="神秘信件"),
        createdAt=now_ts,
    ),
    "edge-2": StoryEdge(
        id="edge-2",
        sourceId="node-a",
        targetId="node-c",
        condition=BranchCondition(type="read_node"),
        createdAt=now_ts,
    ),
    "edge-3": StoryEdge(
        id="edge-3",
        sourceId="node-b",
        targetId="node-d",
        condition=BranchCondition(type="read_node", targetNodeId="node-b"),
        createdAt=now_ts,
    ),
}
sample_story.characters = {
    "char-1": Character(id="char-1", name="林墨", avatar="data:image/svg+xml;base64,c3Zn", color="#e94560"),
    "char-2": Character(id="char-2", name="神秘老者", avatar="data:image/svg+xml;base64,c3Zn", color="#4ade80"),
    "char-3": Character(id="char-3", name="张警官", avatar="data:image/svg+xml;base64,c3Zn", color="#60a5fa"),
    "char-4": Character(id="char-4", name="苏雅", avatar="data:image/svg+xml;base64,c3Zn", color="#fbbf24"),
}
sample_story.relations = {
    "rel-1": CharacterRelation(id="rel-1", sourceId="char-1", targetId="char-4", type="lover"),
    "rel-2": CharacterRelation(id="rel-2", sourceId="char-1", targetId="char-3", type="ally"),
    "rel-3": CharacterRelation(id="rel-3", sourceId="char-1", targetId="char-2", type="unknown"),
    "rel-4": CharacterRelation(id="rel-4", sourceId="char-2", targetId="char-3", type="enemy"),
}
stories["story-1"] = sample_story


def get_or_create_story(story_id: str) -> StoryData:
    if story_id not in stories:
        stories[story_id] = StoryData()
    return stories[story_id]


@app.get("/")
async def root():
    return {"status": "ok", "service": "NarrativeForge API", "stories": len(stories)}


@app.post("/api/stories")
async def create_story(req: CreateStoryRequest):
    story_id = f"story-{uuid.uuid4().hex[:8]}"
    stories[story_id] = StoryData()
    return {
        "id": story_id,
        "title": req.title,
        "description": req.description,
        "createdAt": stories[story_id].createdAt,
        "updatedAt": stories[story_id].updatedAt,
    }


@app.get("/api/stories/{story_id}")
async def get_story(story_id: str):
    if story_id not in stories:
        raise HTTPException(status_code=404, detail="Story not found")
    s = stories[story_id]
    return {
        "id": story_id,
        "nodes": list(s.nodes.values()),
        "edges": list(s.edges.values()),
        "characters": list(s.characters.values()),
        "relations": list(s.relations.values()),
    }


@app.get("/api/stories/{story_id}/nodes")
async def get_nodes(story_id: str):
    s = get_or_create_story(story_id)
    return list(s.nodes.values())


@app.post("/api/stories/{story_id}/nodes")
async def create_node(story_id: str, req: CreateNodeRequest):
    s = get_or_create_story(story_id)
    node_id = f"node-{uuid.uuid4().hex[:8]}"
    now = datetime.now().timestamp()
    node = StoryNode(
        id=node_id,
        title=req.title,
        description=req.description,
        dialogues=req.dialogues,
        position=req.position,
        createdAt=now,
        updatedAt=now,
    )
    s.nodes[node_id] = node
    await broadcast(story_id, {"type": "node:create", "payload": node.model_dump()})
    return node


@app.put("/api/stories/{story_id}/nodes/{node_id}")
async def update_node(story_id: str, node_id: str, updates: dict):
    s = get_or_create_story(story_id)
    if node_id not in s.nodes:
        raise HTTPException(status_code=404, detail="Node not found")
    node = s.nodes[node_id]
    data = node.model_dump()
    for k, v in updates.items():
        if k in data and k != "id":
            data[k] = v
    data["updatedAt"] = datetime.now().timestamp()
    s.nodes[node_id] = StoryNode(**data)
    await broadcast(story_id, {"type": "node:update", "payload": data})
    return s.nodes[node_id]


@app.delete("/api/stories/{story_id}/nodes/{node_id}")
async def delete_node(story_id: str, node_id: str):
    s = get_or_create_story(story_id)
    if node_id in s.nodes:
        del s.nodes[node_id]
        s.edges = {k: v for k, v in s.edges.items() if v.sourceId != node_id and v.targetId != node_id}
        await broadcast(story_id, {"type": "node:delete", "payload": {"id": node_id}})
    return {"success": True}


@app.post("/api/stories/{story_id}/edges")
async def create_edge(story_id: str, req: CreateEdgeRequest):
    s = get_or_create_story(story_id)
    edge_id = f"edge-{uuid.uuid4().hex[:8]}"
    edge = StoryEdge(
        id=edge_id,
        sourceId=req.sourceId,
        targetId=req.targetId,
        condition=req.condition,
        createdAt=datetime.now().timestamp(),
    )
    s.edges[edge_id] = edge
    await broadcast(story_id, {"type": "edge:create", "payload": edge.model_dump()})
    return edge


@app.put("/api/stories/{story_id}/edges/{edge_id}")
async def update_edge(story_id: str, edge_id: str, updates: dict):
    s = get_or_create_story(story_id)
    if edge_id not in s.edges:
        raise HTTPException(status_code=404, detail="Edge not found")
    edge = s.edges[edge_id]
    data = edge.model_dump()
    for k, v in updates.items():
        if k in data and k != "id":
            data[k] = v
    s.edges[edge_id] = StoryEdge(**data)
    await broadcast(story_id, {"type": "edge:update", "payload": data})
    return s.edges[edge_id]


@app.delete("/api/stories/{story_id}/edges/{edge_id}")
async def delete_edge(story_id: str, edge_id: str):
    s = get_or_create_story(story_id)
    if edge_id in s.edges:
        del s.edges[edge_id]
        await broadcast(story_id, {"type": "edge:delete", "payload": {"id": edge_id}})
    return {"success": True}


@app.post("/api/stories/{story_id}/characters")
async def create_character(story_id: str, req: CreateCharacterRequest):
    s = get_or_create_story(story_id)
    char_id = f"char-{uuid.uuid4().hex[:8]}"
    char = Character(id=char_id, name=req.name, avatar=req.avatar, color=req.color)
    s.characters[char_id] = char
    await broadcast(story_id, {"type": "character:create", "payload": char.model_dump()})
    return char


@app.post("/api/stories/{story_id}/relations")
async def create_relation(story_id: str, req: CreateRelationRequest):
    s = get_or_create_story(story_id)
    rel_id = f"rel-{uuid.uuid4().hex[:8]}"
    rel = CharacterRelation(id=rel_id, sourceId=req.sourceId, targetId=req.targetId, type=req.type)
    s.relations[rel_id] = rel
    await broadcast(story_id, {"type": "relation:create", "payload": rel.model_dump()})
    return rel


@app.get("/api/stories/{story_id}/versions")
async def get_versions(story_id: str):
    s = get_or_create_story(story_id)
    return s.versions


@app.get("/api/stories/{story_id}/versions/{version_id}")
async def get_version(story_id: str, version_id: str):
    s = get_or_create_story(story_id)
    for v in s.versions:
        if v.id == version_id:
            return v
    raise HTTPException(status_code=404, detail="Version not found")


@app.post("/api/stories/{story_id}/versions")
async def create_version(story_id: str):
    s = get_or_create_story(story_id)
    default_user = User(id="u1", name="系统用户", avatar="", color="#e94560")
    version = StoryVersion(
        id=f"v-{uuid.uuid4().hex[:8]}",
        version=len(s.versions) + 1,
        createdAt=datetime.now().timestamp(),
        creator=default_user,
        nodes=list(s.nodes.values()),
        edges=list(s.edges.values()),
        characters=list(s.characters.values()),
        relations=list(s.relations.values()),
    )
    s.versions.append(version)
    return version


@app.post("/api/stories/{story_id}/simulate")
async def simulate_story(story_id: str, req: SimulateRequest):
    s = get_or_create_story(story_id)
    path = [req.startNodeId]
    current = req.startNodeId
    choices = []
    max_steps = 20
    steps = 0

    while steps < max_steps:
        out_edges = [e for e in s.edges.values() if e.sourceId == current]
        if not out_edges:
            break
        import random
        edge = random.choice(out_edges)
        choices.append({"nodeId": current, "choice": f"选择分支", "edgeId": edge.id})
        path.append(edge.targetId)
        current = edge.targetId
        steps += 1

    path_nodes = [s.nodes[nid].title for nid in path if nid in s.nodes]
    summary = f"模拟完成：经过 {len(path)} 个剧情节点。路径：{' → '.join(path_nodes)}"

    return {"path": path, "choices": choices, "summary": summary}


async def broadcast(story_id: str, message: dict):
    if story_id in connections:
        dead = []
        for ws in connections[story_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            connections[story_id].remove(ws)


@app.websocket("/ws")
@app.websocket("/ws/socket.io")
async def websocket_endpoint(websocket: WebSocket, storyId: Optional[str] = None):
    await websocket.accept()
    sid = storyId or "default"
    if sid not in connections:
        connections[sid] = []
    connections[sid].append(websocket)

    try:
        while True:
            try:
                data = await websocket.receive_text()
                try:
                    msg = json.loads(data)
                    await broadcast(sid, msg)
                except json.JSONDecodeError:
                    pass
            except WebSocketDisconnect:
                break
    finally:
        if sid in connections and websocket in connections[sid]:
            connections[sid].remove(websocket)
