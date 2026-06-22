from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class VinylBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    artist: str = Field(..., min_length=1, max_length=200)
    release_year: Optional[int] = Field(None, ge=1900, le=2100)
    genre: Optional[str] = Field(None, max_length=100)
    rating: Optional[float] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    cover_url: Optional[str] = None


class VinylCreate(VinylBase):
    pass


class VinylUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    artist: Optional[str] = Field(None, min_length=1, max_length=200)
    release_year: Optional[int] = Field(None, ge=1900, le=2100)
    genre: Optional[str] = Field(None, max_length=100)
    rating: Optional[float] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    cover_url: Optional[str] = None


class VinylResponse(VinylBase):
    id: int
    owner_id: int
    created_at: datetime
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class PlayRecordBase(BaseModel):
    user_id: int
    vinyl_id: int
    duration_seconds: Optional[int] = Field(None, ge=0)


class PlayRecordCreate(PlayRecordBase):
    pass


class PlayRecordUpdate(BaseModel):
    duration_seconds: Optional[int] = Field(None, ge=0)


class PlayRecordResponse(PlayRecordBase):
    id: int
    played_at: datetime
    user: Optional[UserResponse] = None
    vinyl: Optional[VinylResponse] = None

    class Config:
        from_attributes = True


class PostBase(BaseModel):
    content: str = Field(..., min_length=1)
    vinyl_id: Optional[int] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)


class PostResponse(PostBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None
    vinyl: Optional[VinylResponse] = None
    likes_count: Optional[int] = 0
    comments_count: Optional[int] = 0

    class Config:
        from_attributes = True


class LikeBase(BaseModel):
    user_id: int
    post_id: int


class LikeCreate(LikeBase):
    pass


class LikeResponse(LikeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    post_id: int
    content: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)


class CommentResponse(CommentBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class FriendshipBase(BaseModel):
    user_id: int
    friend_id: int


class FriendshipCreate(FriendshipBase):
    pass


class FriendshipResponse(FriendshipBase):
    id: int
    created_at: datetime
    friend: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class TokenWithRefresh(Token):
    refresh_token: str


class VinylDetailResponse(VinylResponse):
    friends_who_listened: List[UserResponse] = []

    class Config:
        from_attributes = True


class PostDetailResponse(PostResponse):
    is_liked: bool = False
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True


class PlayRecordHeatmapItem(BaseModel):
    date: str
    count: int


class WeeklyPlayTimeItem(BaseModel):
    week: str
    hours: float


class UserStatsResponse(BaseModel):
    collection_count: int
    total_plays: int
    avg_rating: Optional[float]
    genre_distribution: dict


class TrendingVinyl(BaseModel):
    id: int
    title: str
    artist: str
    genre: Optional[str]
    cover_url: Optional[str]
    add_count: int
