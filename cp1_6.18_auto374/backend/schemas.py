from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookResponse(BookBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserBookBase(BaseModel):
    book_id: int


class UserBookCreate(UserBookBase):
    pass


class UserBookProgressUpdate(BaseModel):
    progress: int


class UserBookResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    progress: int
    added_at: datetime
    book: BookResponse

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    content: str


class ReviewCreate(ReviewBase):
    book_id: int


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    book_id: int
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_time: datetime
    book_id: Optional[int] = None


class EventCreate(EventBase):
    pass


class EventResponse(EventBase):
    id: int
    creator_id: int
    status: str
    created_at: datetime
    creator: UserResponse
    participants: List["EventParticipantResponse"] = []

    class Config:
        from_attributes = True


class EventParticipantBase(BaseModel):
    event_id: int


class EventParticipantCreate(EventParticipantBase):
    pass


class EventParticipantResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    joined_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class CommunityItem(BaseModel):
    type: str
    data: dict
    created_at: datetime
