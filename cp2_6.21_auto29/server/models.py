from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


class Column(BaseModel):
    id: str
    title: str
    order: int = 0


class TaskBase(BaseModel):
    title: str = Field(..., max_length=50)
    assignee: Optional[str] = None
    priority: str = "medium"
    estimated_hours: float = 0
    start_date: Optional[str] = None
    dependencies: List[str] = []

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = ["high", "medium", "low"]
        if v not in allowed:
            raise ValueError(f"priority must be one of {allowed}")
        return v

    @field_validator("estimated_hours")
    @classmethod
    def validate_hours(cls, v: float) -> float:
        if v < 0:
            raise ValueError("estimated_hours must be non-negative")
        return v


class TaskCreate(TaskBase):
    column_id: str


class TaskUpdate(TaskBase):
    title: Optional[str] = Field(None, max_length=50)
    column_id: Optional[str] = None
    order: Optional[int] = None


class Task(TaskBase):
    id: str
    column_id: str
    order: int = 0
    dependencies: List[str] = []

    class Config:
        from_attributes = True


class TaskMove(BaseModel):
    task_id: str
    from_column_id: str
    to_column_id: str
    to_index: int


class LogEntry(BaseModel):
    id: str
    timestamp: str
    operator: str
    action_type: str
    details: Optional[str] = None


class LogCreate(BaseModel):
    operator: str
    action_type: str
    details: Optional[str] = None
