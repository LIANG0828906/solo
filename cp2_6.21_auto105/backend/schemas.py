from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    avatar: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class AttractionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    location: Optional[str] = ""
    image_url: Optional[str] = ""
    day_plan_id: Optional[int] = None
    order_index: Optional[int] = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AttractionCreate(AttractionBase):
    pass


class AttractionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    day_plan_id: Optional[int] = None
    order_index: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class CommentCreate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: int
    user_id: int
    attraction_id: int
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class AttractionResponse(AttractionBase):
    id: int
    trip_id: int
    created_at: datetime
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True


class DayPlanBase(BaseModel):
    day_number: int
    date: Optional[str] = ""
    notes: Optional[str] = ""


class DayPlanCreate(DayPlanBase):
    pass


class DayPlanResponse(DayPlanBase):
    id: int
    trip_id: int
    attractions: List[AttractionResponse] = []

    class Config:
        from_attributes = True


class TripBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    cover_image: Optional[str] = ""
    is_public: Optional[bool] = False


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_public: Optional[bool] = None


class TripResponse(TripBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: UserResponse
    day_plans: List[DayPlanResponse] = []
    attractions: List[AttractionResponse] = []
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    is_favorited: bool = False

    class Config:
        from_attributes = True


class TripListItem(BaseModel):
    id: int
    title: str
    description: str
    cover_image: str
    is_public: bool
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: UserResponse
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    is_favorited: bool = False

    class Config:
        from_attributes = True


class CollaboratorBase(BaseModel):
    user_id: int
    role: Optional[str] = "editor"


class CollaboratorCreate(CollaboratorBase):
    username_or_email: Optional[str] = ""


class CollaboratorResponse(BaseModel):
    id: int
    trip_id: int
    user_id: int
    role: str
    invited_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class InviteRequest(BaseModel):
    username_or_email: str


class WSMessage(BaseModel):
    type: str
    data: dict
