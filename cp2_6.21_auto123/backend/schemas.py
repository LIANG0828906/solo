from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TagCount(BaseModel):
    tag: str
    count: int


class SnippetBase(BaseModel):
    title: str
    code: str
    language: str = "javascript"


class SnippetCreate(SnippetBase):
    tags: List[str] = Field(default_factory=list)


class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None
    tags: Optional[List[str]] = None


class SnippetResponse(SnippetBase):
    id: str
    tags: List[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class SearchResult(SnippetResponse):
    matched_lines: List[int] = Field(default_factory=list)
