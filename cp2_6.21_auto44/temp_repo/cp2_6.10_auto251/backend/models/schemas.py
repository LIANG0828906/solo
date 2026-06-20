from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum


class EventType(str, Enum):
    SHORTAGE = "shortage"
    POISON = "poison"
    BOOKWORM = "bookworm"
    PLAGUE = "plague"


class ScoreGrade(str, Enum):
    XIA_GONG = "下工"
    ZHONG_GONG = "中工"
    SHANG_GONG = "上工"
    SHEN_YI = "神医"


class Herb(BaseModel):
    id: int
    name: str
    pinyin: str
    nature: str
    meridians: List[str]
    efficacy: str
    indications: List[str]
    dosage: str
    category: str


class TaskType(str, Enum):
    MATCH_EFFICACY = "match_efficacy"
    MATCH_INDICATION = "match_indication"
    MATCH_MERIDIAN = "match_meridian"
    MATCH_CATEGORY = "match_category"
    FILL_BLANK = "fill_blank"


class TaskOption(BaseModel):
    herb_id: int
    herb_name: str


class Task(BaseModel):
    id: int
    period: int
    day: int
    type: TaskType
    question: str
    options: List[TaskOption]
    correct_herb_id: int
    time_limit: int = 30


class GenerateTaskRequest(BaseModel):
    period: int
    day: int


class SubmitAnswerRequest(BaseModel):
    task_id: int
    selected_herb_id: int
    response_time: float


class ScoreResponse(BaseModel):
    total_score: float
    correct_count: int
    total_count: int
    accuracy: float
    grade: ScoreGrade
    period: int
    day: int


class GameEvent(BaseModel):
    id: int
    type: EventType
    title: str
    description: str
    options: List[str]
    correct_option: int
    penalty: float
    bonus: float


class TriggerEventRequest(BaseModel):
    period: int
    day: int


class ResolveEventRequest(BaseModel):
    event_id: int
    selected_option: int


class ResolveEventResponse(BaseModel):
    success: bool
    message: str
    score_change: float
    event_type: EventType


class EndPeriodRequest(BaseModel):
    period: int


class EndPeriodResponse(BaseModel):
    period: int
    total_days: int
    score: float
    grade: ScoreGrade
    summary: str
