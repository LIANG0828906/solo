from typing import List, Dict
from pydantic import BaseModel


class VoteOptionCreate(BaseModel):
    name: str
    description: str = ""
    order: int = 0


class VoteCreate(BaseModel):
    title: str
    description: str
    options: List[VoteOptionCreate]


class WeightSubmission(BaseModel):
    voteId: str
    voterId: str
    weights: Dict[str, int]
