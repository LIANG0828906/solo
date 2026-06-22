from pydantic import BaseModel, Field
from typing import Literal, Optional


SymbolCategory = Literal['flying', 'falling', 'chasing', 'lost', 'water', 'forest', 'star', 'rare']
SymbolRarity = Literal['common', 'rare', 'legendary']
SlotPosition = Literal['north', 'south', 'east', 'west']


class DreamSymbol(BaseModel):
    id: str
    name: str
    emoji: str
    category: SymbolCategory
    rarity: SymbolRarity
    description: str

    class Config:
        populate_by_name = True


class DreamSlot(BaseModel):
    id: str
    position: SlotPosition
    symbol: Optional[DreamSymbol] = None

    class Config:
        populate_by_name = True


class EmotionIndex(BaseModel):
    excitement: float
    anxiety: float
    peace: float

    class Config:
        populate_by_name = True


class DreamResult(BaseModel):
    id: str
    date: str
    symbols: list[DreamSymbol]
    interpretation: str
    emotion: EmotionIndex
    illustration_url: str = Field(..., alias='illustrationUrl')
    is_success: bool = Field(..., alias='isSuccess')
    star_lit: bool = Field(..., alias='starLit')

    class Config:
        populate_by_name = True


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool

    class Config:
        populate_by_name = True


class WeeklyReport(BaseModel):
    week_start: str = Field(..., alias='weekStart')
    week_end: str = Field(..., alias='weekEnd')
    total_dreams: int = Field(..., alias='totalDreams')
    emotion_trend: list[dict] = Field(..., alias='emotionTrend')
    symbol_frequency: list[dict] = Field(..., alias='symbolFrequency')
    rare_collected: list[DreamSymbol] = Field(..., alias='rareCollected')
    achievements: list[Achievement]

    class Config:
        populate_by_name = True


class GenerateDreamRequest(BaseModel):
    date: str
    symbols: list[DreamSymbol]


class SaveDreamRequest(BaseModel):
    dream: DreamResult
