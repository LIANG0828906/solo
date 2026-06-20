from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class BoardRoomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None


class CreativeCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    content: str = Field(..., min_length=1, max_length=200)
    type: Optional[str] = "idea"
    author: str
    created_by: str = Field(..., alias="createdBy")


class CreativeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    content: str
    type: str
    author: str
    votes: int
    voters: List[str]
    created_at: datetime = Field(..., alias="createdAt")
    board_room_id: str = Field(..., alias="boardRoomId")
    created_by: str = Field(..., alias="createdBy")


class BoardRoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    description: Optional[str]
    created_at: datetime = Field(..., alias="createdAt")
    creative_count: int = Field(0, alias="creativeCount")


class BoardRoomDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    description: Optional[str]
    created_at: datetime = Field(..., alias="createdAt")
    creatives: List[CreativeResponse] = []
