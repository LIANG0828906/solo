from pydantic import BaseModel, Field
from typing import List, Literal, Optional

ElementType = Literal['wood', 'metal', 'fire', 'water', 'earth']
RelationType = Literal['generates', 'overcomes']
RankType = Literal['S', 'A', 'B', 'C', 'D']


class CalculusAttributes(BaseModel):
    hardness: int = Field(..., ge=0, le=100)
    sharpness: int = Field(..., ge=0, le=100)
    resonance: int = Field(..., ge=0, le=100)
    durability: int = Field(..., ge=0, le=100)
    flexibility: int = Field(..., ge=0, le=100)


class Calculus(BaseModel):
    id: str
    element: ElementType
    name: str
    rotation: int = 0
    flipped: bool = False
    position: Optional[dict] = None
    gridPosition: Optional[dict] = None
    attributes: CalculusAttributes


class GridPosition(BaseModel):
    calculusId: str
    gridX: int
    gridZ: int


class ArtifactAttributes(BaseModel):
    solidity: int
    sharpness: int
    temperament: int
    durability: int
    balance: int


class ElementRelation(BaseModel):
    type: RelationType
    from_element: ElementType = Field(..., alias='from')
    to: ElementType
    effect: int

    class Config:
        populate_by_name = True


class CombineRequest(BaseModel):
    calculi: List[Calculus]
    gridPositions: List[GridPosition]


class CombineResponse(BaseModel):
    artifactType: str
    artifactName: str
    attributes: ArtifactAttributes
    relations: List[ElementRelation]
    bonusEffects: List[str]


class RatingBreakdown(BaseModel):
    attributeScore: int
    harmonyScore: int
    creativityScore: int
    efficiencyScore: int


class RatingRecord(BaseModel):
    id: str
    timestamp: float
    artifactName: str
    artifactType: str
    attributes: ArtifactAttributes
    totalScore: int
    rank: str


class RatingRequest(BaseModel):
    artifact: CombineResponse
    calculiCount: int
    buildTime: float


class RatingResponse(BaseModel):
    totalScore: int
    rank: RankType
    breakdown: RatingBreakdown
    record: RatingRecord
