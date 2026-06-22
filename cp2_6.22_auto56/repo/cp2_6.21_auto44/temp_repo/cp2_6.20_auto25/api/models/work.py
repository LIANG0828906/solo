from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class FileType(str, Enum):
    image = "image"
    video = "video"


class WorkStatus(str, Enum):
    pending = "pending"
    published = "published"
    rejected = "rejected"


class WorkResponse(BaseModel):
    id: str
    title: str
    uploader: str
    uploader_email: str
    file_url: str
    file_type: FileType
    thumbnail_url: Optional[str] = None
    status: WorkStatus = WorkStatus.pending
    created_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    reject_reason: Optional[str] = None


class WorkCreate(BaseModel):
    title: str
    uploader: str
    uploader_email: str
    file_type: FileType


class ReviewAction(str, Enum):
    approve = "approve"
    reject = "reject"


class ReviewRequest(BaseModel):
    action: ReviewAction
    reject_reason: Optional[str] = None


class UploadResponse(BaseModel):
    id: str
    file_url: str
    thumbnail_url: Optional[str] = None
    status: str
