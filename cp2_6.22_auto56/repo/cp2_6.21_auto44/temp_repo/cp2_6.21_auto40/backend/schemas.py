from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CurvePoint(BaseModel):
    time: float
    bean_temp: float
    env_temp: float
    ror: float
    phase: int


class Marker(BaseModel):
    time: float
    label: str


class BatchCreate(BaseModel):
    bean_type: str
    roast_level: str
    charge_temp: float
    drop_temp: float
    total_time: float
    curve_data: list[CurvePoint]
    markers: list[Marker]
    is_public: bool = True
    rating: int = 3


class BatchResponse(BaseModel):
    id: int
    bean_type: str
    roast_level: str
    charge_temp: float
    drop_temp: float
    total_time: float
    curve_data: str
    markers: str
    is_public: bool
    rating: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TasteNoteCreate(BaseModel):
    batch_id: int
    category: str
    sub_flavors: list[str]


class TasteNoteResponse(BaseModel):
    id: int
    batch_id: int
    category: str
    sub_flavors: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    batch_id: int
    content: str


class CommentResponse(BaseModel):
    id: int
    batch_id: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PublicBatch(BaseModel):
    id: int
    bean_type: str
    roast_level: str
    charge_temp: float
    drop_temp: float
    total_time: float
    rating: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityResponse(BaseModel):
    items: list[PublicBatch]
    total: int
    page: int
    page_size: int


class PublicBatchDetail(BaseModel):
    id: int
    bean_type: str
    roast_level: str
    charge_temp: float
    drop_temp: float
    total_time: float
    curve_data: str
    markers: str
    is_public: bool
    rating: int
    created_at: datetime
    taste_notes: list[TasteNoteResponse]
    comments: list[CommentResponse]

    model_config = {"from_attributes": True}
