from __future__ import annotations

from pydantic import BaseModel


class Tag(BaseModel):
    id: str
    name: str
    category: str


class Note(BaseModel):
    id: str
    title: str
    content: str
    summary: str
    tags: list[Tag]
    createdAt: str
    updatedAt: str
    referenceIds: list[str]


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    tagIds: list[str] = []


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    tagIds: list[str] | None = None


class LinkRelation(BaseModel):
    sourceId: str
    targetId: str
    type: str


class GraphNode(BaseModel):
    id: str
    title: str
    tags: list[Tag]
    radius: float


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class Backlink(BaseModel):
    noteId: str
    title: str
    snippet: str
