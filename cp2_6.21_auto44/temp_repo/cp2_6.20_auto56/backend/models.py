from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class PetType(str, Enum):
    cat = "cat"
    dog = "dog"
    dragon = "dragon"


class PetColor(str, Enum):
    default = "default"
    pink = "pink"
    blue = "blue"


class Position(BaseModel):
    x: int = 0
    y: int = 0


class Pet(BaseModel):
    id: str
    name: str
    type: PetType
    color: PetColor
    hunger: float = Field(default=70, ge=0, le=100)
    happiness: float = Field(default=70, ge=0, le=100)
    energy: float = Field(default=70, ge=0, le=100)
    position: Position = Field(default_factory=Position)
    owner_id: str
    owner_name: str
    is_online: bool = True
    last_update: float = Field(default_factory=lambda: datetime.now().timestamp())


class GiftItem(BaseModel):
    gift_id: str
    quantity: int = 0


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    unlocked: bool = False
    icon: str
    condition: str


class User(BaseModel):
    id: str
    name: str
    avatar: str = "😊"
    coins: int = 100
    pet: Optional[Pet] = None
    inventory: List[GiftItem] = Field(default_factory=list)
    achievements: List[Achievement] = Field(default_factory=list)
    last_login: str = Field(default_factory=lambda: datetime.now().isoformat())
    consecutive_days: int = 1
    gifts_sent: int = 0
    max_happiness: int = 0
    daily_claimed: bool = False


class AdoptRequest(BaseModel):
    type: PetType
    color: PetColor
    name: str


class Gift(BaseModel):
    id: str
    name: str
    icon: str
    price: int
    description: str


class BuyGiftRequest(BaseModel):
    gift_id: str


class LeaderboardEntry(BaseModel):
    user_id: str
    user_name: str
    avatar: str
    pet_name: str
    total_happiness: int
    rank: int


class GardenEvent(BaseModel):
    id: str
    type: str
    from_pet_id: str
    to_pet_id: Optional[str] = None
    gift_id: Optional[str] = None
    timestamp: float


class SendGiftRequest(BaseModel):
    from_pet_id: str
    to_pet_id: str
    gift_id: str


class MoveRequest(BaseModel):
    pet_id: str
    position: Position
