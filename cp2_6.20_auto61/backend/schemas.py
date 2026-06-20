from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=255)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_expert: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class FragmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    era: Optional[str] = None
    material: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    age_range: Optional[str] = None
    condition: Optional[str] = None


class FragmentCreate(FragmentBase):
    era_answer: Optional[str] = None
    material_answer: Optional[str] = None


class FragmentResponse(FragmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FragmentDetailResponse(FragmentResponse):
    era_answer: Optional[str] = None
    material_answer: Optional[str] = None


class ClassifyRequest(BaseModel):
    fragment_id: int
    era_prediction: str
    material_prediction: str


class ClassifyResponse(BaseModel):
    fragment_id: int
    era_prediction: str
    material_prediction: str
    era_answer: str
    material_answer: str
    era_correct: bool
    material_correct: bool
    overall_correct: bool


class RepairStepBase(BaseModel):
    description: str
    tool_used: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None


class RepairStepCreate(RepairStepBase):
    step_order: int


class RepairStepResponse(RepairStepBase):
    id: int
    step_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class RepairRecordBase(BaseModel):
    title: str
    description: Optional[str] = None
    fragment_id: Optional[int] = None


class RepairRecordCreate(RepairRecordBase):
    pass


class RepairRecordResponse(RepairRecordBase):
    id: int
    user_id: int
    status: str
    is_submitted: bool
    created_at: datetime
    updated_at: datetime
    steps: List[RepairStepResponse] = []

    class Config:
        from_attributes = True


class RepairStepAdd(BaseModel):
    description: str
    tool_used: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None


class KnowledgeNode(BaseModel):
    id: str
    label: str
    type: str
    description: Optional[str] = None


class KnowledgeEdge(BaseModel):
    source: str
    target: str
    relation: str


class KnowledgeGraphResponse(BaseModel):
    nodes: List[KnowledgeNode]
    edges: List[KnowledgeEdge]
