from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CardBase(BaseModel):
    type: str = Field(..., pattern="^(text|image|todo)$")
    title: str
    content: str
    color: Optional[str] = None
    x: float = 0.0
    y: float = 0.0
    z_index: int = 0


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(text|image|todo)$")
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    z_index: Optional[int] = None


class Card(CardBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
