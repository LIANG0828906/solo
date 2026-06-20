from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List, Dict


class TrainingRecordCreate(BaseModel):
    type: str
    duration: int
    date: date
    notes: Optional[str] = None


class TrainingRecordResponse(BaseModel):
    id: int
    type: str
    duration: int
    date: date
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    condition_type: str
    condition_value: int
    unlocked: bool
    unlocked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DailyStats(BaseModel):
    day: int
    duration: int


class TypeDistribution(BaseModel):
    type: str
    duration: int
    count: int


class MonthlyStatsResponse(BaseModel):
    month: str
    total_duration: int
    total_count: int
    daily_stats: List[DailyStats]
    type_distribution: List[TypeDistribution]
