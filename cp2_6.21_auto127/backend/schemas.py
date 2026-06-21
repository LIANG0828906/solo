from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        orm_mode = True


class DocumentCreate(BaseModel):
    title: str
    content: str


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AnnotationCreate(BaseModel):
    paragraph_index: int
    color: str = "#ffff00"
    text: str


class AnnotationResponse(BaseModel):
    id: int
    doc_id: int
    user_id: Optional[int]
    user_name: str
    paragraph_index: int
    color: str
    text: str
    created_at: datetime

    class Config:
        orm_mode = True


class SnapshotResponse(BaseModel):
    id: int
    doc_id: int
    version: int
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
