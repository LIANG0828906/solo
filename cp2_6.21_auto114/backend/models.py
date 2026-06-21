from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class AvatarCrop(BaseModel):
    x: int
    y: int
    w: int
    h: int


class NodeBase(BaseModel):
    name: str
    photo_url: Optional[str] = Field(None, alias="photoUrl")
    avatar_crop: Optional[AvatarCrop] = Field(None, alias="avatarCrop")
    generation: int = 0
    is_collapsed: bool = Field(False, alias="isCollapsed")
    parent_ids: List[str] = Field(default_factory=list, alias="parentIds")
    children_ids: List[str] = Field(default_factory=list, alias="childrenIds")

    class Config:
        populate_by_name = True


class NodeCreate(NodeBase):
    id: str


class Node(NodeCreate):
    tree_id: str = Field(..., alias="treeId")

    class Config:
        from_attributes = True


RelationType = Literal["blood", "marriage"]


class RelationBase(BaseModel):
    from_node_id: str = Field(..., alias="fromNodeId")
    to_node_id: str = Field(..., alias="toNodeId")
    type: RelationType = "blood"
    label: Optional[str] = None

    class Config:
        populate_by_name = True


class RelationCreate(RelationBase):
    id: str


class Relation(RelationCreate):
    tree_id: str = Field(..., alias="treeId")

    class Config:
        from_attributes = True


class Collaborator(BaseModel):
    id: str
    username: str
    color: str
    cursor_x: float = Field(0.0, alias="cursorX")
    cursor_y: float = Field(0.0, alias="cursorY")
    last_active: datetime = Field(default_factory=datetime.utcnow, alias="lastActive")

    class Config:
        populate_by_name = True


class FamilyTreeBase(BaseModel):
    name: str = "我的家谱"


class FamilyTreeCreate(FamilyTreeBase):
    nodes: List[NodeCreate] = Field(default_factory=list)
    relations: List[RelationCreate] = Field(default_factory=list)


class FamilyTreeUpdate(BaseModel):
    name: Optional[str] = None
    nodes: Optional[List[NodeCreate]] = None
    relations: Optional[List[RelationCreate]] = None


class FamilyTree(FamilyTreeBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")
    nodes: List[Node] = Field(default_factory=list)
    relations: List[Relation] = Field(default_factory=list)

    class Config:
        from_attributes = True
        populate_by_name = True


class FamilyTreeSummary(BaseModel):
    id: str
    name: str
    created_at: datetime = Field(alias="createdAt")

    class Config:
        populate_by_name = True


class FamilyTreeStats(BaseModel):
    total_members: int = Field(0, alias="totalMembers")
    generations: int = 0

    class Config:
        populate_by_name = True


class ShareInfo(BaseModel):
    share_url: str = Field(..., alias="shareUrl")
    stats: FamilyTreeStats

    class Config:
        populate_by_name = True


class SuccessResponse(BaseModel):
    success: bool = True
