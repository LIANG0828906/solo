from pydantic import BaseModel, Field
from typing import Optional, List


class NodeModel(BaseModel):
    id: str
    title: str = ""
    note: str = ""
    color: str = "#ffffff"
    fontSize: int = 16
    x: float = 0.0
    y: float = 0.0
    shape: str = "rounded-rectangle"
    parentId: Optional[str] = None


class EdgeModel(BaseModel):
    id: str
    source: str
    target: str


class WSMessage(BaseModel):
    type: str
    userId: str
    mindmapId: str
    data: dict
    timestamp: float
    messageId: str


class MindMapData(BaseModel):
    id: str
    title: str = "思维导图"
    nodes: List[NodeModel] = []
    edges: List[EdgeModel] = []


class LoginRequest(BaseModel):
    username: str


class LoginResponse(BaseModel):
    userId: str
    username: str


class CreateMindMapRequest(BaseModel):
    title: str = "新思维导图"
    userId: str


class MindMapResponse(BaseModel):
    id: str
    title: str
    nodes: List[NodeModel]
    edges: List[EdgeModel]
