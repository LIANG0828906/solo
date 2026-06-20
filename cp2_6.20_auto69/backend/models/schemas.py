from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional, Generic, TypeVar

T = TypeVar('T')


class ClassBase(BaseModel):
    name: str
    studentCount: int


class ClassCreate(ClassBase):
    pass


class Class(ClassBase):
    id: str
    lastGradedDate: Optional[date] = None

    class Config:
        from_attributes = True


class EssayBase(BaseModel):
    classId: str
    studentName: str
    title: str
    content: str


class EssayCreate(EssayBase):
    pass


class Essay(EssayBase):
    id: str
    filePath: Optional[str] = None
    uploadTime: datetime

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    essayId: str
    paragraphIndex: int
    content: str
    type: str
    presetType: Optional[str] = None


class CommentCreate(CommentBase):
    pass


class Comment(CommentBase):
    id: str
    createdAt: datetime

    class Config:
        from_attributes = True


class PresetCommentBase(BaseModel):
    content: str
    type: str


class PresetCommentCreate(PresetCommentBase):
    pass


class PresetComment(PresetCommentBase):
    id: str
    createdAt: datetime

    class Config:
        from_attributes = True


class ScoreBase(BaseModel):
    essayId: str
    content: int
    language: int
    structure: int
    creativity: int


class ScoreCreate(ScoreBase):
    pass


class Score(ScoreBase):
    id: str
    gradedAt: datetime

    class Config:
        from_attributes = True


class DimensionStats(BaseModel):
    dimension: str
    average: float
    color: str


class GradeDistribution(BaseModel):
    grade: str
    count: int
    color: str


class RadarData(BaseModel):
    dimension: str
    student: float
    classAverage: float


class ApiResponse(BaseModel, Generic[T]):
    code: int
    data: T
    message: str
