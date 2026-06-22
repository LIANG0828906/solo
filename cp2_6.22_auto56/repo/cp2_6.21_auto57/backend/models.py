from pydantic import BaseModel
from typing import Optional, List


class RecordCreate(BaseModel):
    timestamp: str
    category: str
    intensity: int
    energy: int
    note: Optional[str] = ""
    tags: Optional[List[str]] = []


class RecordResponse(BaseModel):
    id: int
    timestamp: str
    category: str
    intensity: int
    energy: int
    note: str
    tags: str


class DaySummary(BaseModel):
    date: str
    avg_intensity: float
    avg_energy: float
    count: int


class TrendData(BaseModel):
    date: str
    avg_intensity: float
    avg_energy: float


class TagAnalysis(BaseModel):
    tag: str
    avg_intensity: float
    count: int


class AnalysisResponse(BaseModel):
    avg_intensity: float
    std_intensity: float
    max_day: Optional[str]
    min_day: Optional[str]
    correlation: Optional[float]
    tag_stats: List[TagAnalysis]
