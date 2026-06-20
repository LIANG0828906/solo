from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TrainingRecordCreate(BaseModel):
    type: str
    typeName: str
    duration: int
    date: str
    note: Optional[str] = ""


class TrainingRecord(BaseModel):
    id: int
    type: str
    typeName: str
    duration: int
    date: str
    note: str
    createdAt: str

    class Config:
        from_attributes = True


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool
    unlockedAt: Optional[str] = None
    condition: str


class DailyStat(BaseModel):
    date: str
    duration: int


class TypeStat(BaseModel):
    type: str
    typeName: str
    duration: int
    color: str


class MonthStats(BaseModel):
    month: str
    dailyStats: List[DailyStat]
    typeStats: List[TypeStat]
    totalDuration: int
    totalRecords: int
