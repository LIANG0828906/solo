from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime


class Furniture(BaseModel):
    id: int
    name: str
    category: str
    price: float
    image_url: str
    description: str
    dimensions: Optional[str] = None
    material: Optional[str] = None
    style_tags: List[str]


class Style(BaseModel):
    id: int
    name: str
    description: str
    color_palette: List[str]
    image_url: str


class FurnitureItem(BaseModel):
    furniture_id: int
    position_x: float
    position_y: float
    rotation: float = 0.0
    scale: float = 1.0


class DesignSaveRequest(BaseModel):
    name: str
    style_id: int
    room_width: float
    room_height: float
    furniture_items: List[FurnitureItem]
    description: Optional[str] = None


class DesignResponse(BaseModel):
    id: str
    name: str
    style_id: int
    style_name: str
    room_width: float
    room_height: float
    furniture_items: List[FurnitureItem]
    total_price: float
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PriceResponse(BaseModel):
    prices: Dict[int, float]
