from pydantic import BaseModel
from typing import List, Literal


ErrorType = Literal["spelling", "punctuation", "grammar"]


class GrammarError(BaseModel):
    id: str
    type: ErrorType
    text: str
    offset: int
    length: int
    suggestion: str
    message: str


class StructureAnalysis(BaseModel):
    hasIntro: bool
    hasBody: bool
    hasConclusion: bool
    introPercent: float
    bodyPercent: float
    conclusionPercent: float
    suggestions: List[str]


class ScoreBreakdown(BaseModel):
    grammar: int
    structure: int
    vocabulary: int
    relevance: int
    total: int


class EssaySubmission(BaseModel):
    id: str
    title: str
    content: str
    submittedAt: str
    errors: List[GrammarError]
    structure: StructureAnalysis
    scores: ScoreBreakdown


class SubmitEssayRequest(BaseModel):
    title: str
    content: str


class StatsResponse(BaseModel):
    totalSubmissions: int
    scoreDistribution: dict
    errorTypeCount: dict
    averageScore: float
