from typing import List, Optional, Dict, Union
from pydantic import BaseModel, Field
from datetime import datetime


class GameVariable(BaseModel):
    id: str
    name: str
    type: str
    initialValue: Union[int, float, bool]
    minValue: Optional[Union[int, float]] = None
    maxValue: Optional[Union[int, float]] = None
    color: Optional[str] = None


class VariableRule(BaseModel):
    variableId: str
    operation: str
    value: Union[int, float, bool]


class TriggerCondition(BaseModel):
    variableId: str
    operator: str
    value: Union[int, float, bool]


class Position(BaseModel):
    x: float
    y: float


class SceneNode(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    backgroundImageUrl: str = ""
    backgroundMusicUrl: str = ""
    variableRules: List[VariableRule] = Field(default_factory=list)
    position: Position = Field(default_factory=lambda: Position(x=0, y=0))
    isStart: Optional[bool] = False


class SceneEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""
    conditions: List[TriggerCondition] = Field(default_factory=list)


class Story(BaseModel):
    id: str
    title: str = ""
    author: str = ""
    coverImageUrl: str = ""
    playCount: int = 0
    averageRating: float = 0.0
    ratingCount: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    published: bool = False
    shortUrl: Optional[str] = None
    nodes: List[SceneNode] = Field(default_factory=list)
    edges: List[SceneEdge] = Field(default_factory=list)
    variables: List[GameVariable] = Field(default_factory=list)
    startNodeId: Optional[str] = None


class StoryCreate(BaseModel):
    title: Optional[str] = "新故事"
    author: Optional[str] = "匿名创作者"


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    coverImageUrl: Optional[str] = None
    published: Optional[bool] = None
    nodes: Optional[List[SceneNode]] = None
    edges: Optional[List[SceneEdge]] = None
    variables: Optional[List[GameVariable]] = None
    startNodeId: Optional[str] = None


class RatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class PublishResponse(BaseModel):
    shortUrl: str
    shortId: str


class ShortUrlResponse(BaseModel):
    storyId: str
    story: Story
