from pydantic import BaseModel
from typing import Optional


class KeyResultBase(BaseModel):
    id: str
    name: str
    targetValue: float
    currentValue: float
    weight: int
    objectiveId: str


class ObjectiveBase(BaseModel):
    id: str
    name: str
    level: str
    parentId: Optional[str] = None
    progress: float
    keyResults: list[KeyResultBase] = []


class ObjectiveCreate(BaseModel):
    name: str
    level: str
    parentId: Optional[str] = None


class ObjectiveUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    parentId: Optional[str] = None
    keyResults: Optional[list[KeyResultBase]] = None


class ObjectiveMove(BaseModel):
    parentId: Optional[str] = None


class MilestoneBase(BaseModel):
    id: str
    name: str
    startMonth: int
    endMonth: int
    progress: float


class MilestoneUpdate(BaseModel):
    progress: float


class UserBase(BaseModel):
    id: str
    name: str
