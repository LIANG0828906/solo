from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BoardRoomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None


class CreativeCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=200)
    type: Optional[str] = "idea"
    author: str
    created_by: str


class CreativeResponse(BaseModel):
    id: str
    content: str
    type: str
    author: str
    votes: int
    voters: List[str]
    created_at: datetime
    board_room_id: str
    created_by: str

    class Config:
        from_attributes = True


class BoardRoomResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    creative_count: int = 0

    class Config:
        from_attributes = True


class BoardRoomDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    creatives: List[CreativeResponse] = []

    class Config:
        from_attributes = True
