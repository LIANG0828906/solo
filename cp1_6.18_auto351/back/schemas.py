from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DiaryBase(BaseModel):
    text_content: str = Field(..., min_length=1, max_length=2000)
    is_public: bool = False
    emotion_x: Optional[float] = 50.0
    emotion_y: Optional[float] = 50.0
    emotion_type: Optional[str] = "平静"


class DiaryCreate(DiaryBase):
    user_id: int


class DiaryUpdate(BaseModel):
    text_content: Optional[str] = None
    is_public: Optional[bool] = None
    emotion_x: Optional[float] = None
    emotion_y: Optional[float] = None
    emotion_type: Optional[str] = None


class Diary(DiaryBase):
    id: int
    user_id: int
    audio_path: Optional[str] = None
    created_at: datetime
    owner: Optional[User] = None

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class CommentCreate(CommentBase):
    user_id: int


class Comment(CommentBase):
    id: int
    diary_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True


class AudioAnalysisResult(BaseModel):
    emotion_x: float
    emotion_y: float
    emotion_type: str
    speech_rate: float
    pitch_mean: float
    energy_std: float
