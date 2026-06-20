from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field


class Choice(BaseModel):
    id: str
    text: str
    next_node_id: str
    condition: Optional[Dict[str, Any]] = None
    effect: Optional[Union[str, Dict[str, Any]]] = None


class StoryNode(BaseModel):
    id: str
    text: str
    choices: List[Choice] = Field(default_factory=list)
    end: Optional[bool] = False
    ending_type: Optional[str] = None


class Attributes(BaseModel):
    health: int = 100
    sanity: int = 100
    gold: int = 0
    charisma: int = 50


class InventoryItem(BaseModel):
    id: str
    name: str
    description: str


class HistoryEntry(BaseModel):
    node_id: str
    choice_id: Optional[str] = None
    timestamp: int


class GameState(BaseModel):
    currentNodeId: str = ""
    attributes: Attributes = Field(default_factory=Attributes)
    inventory: List[InventoryItem] = Field(default_factory=list)
    history: List[HistoryEntry] = Field(default_factory=list)
    isEnded: bool = False


class SaveData(BaseModel):
    id: str
    timestamp: int
    sceneSummary: str
    state: GameState


class StartStoryRequest(BaseModel):
    theme: Optional[str] = None


class ChooseRequest(BaseModel):
    current_node_id: str
    choice_id: str
    state: GameState


class StartStoryResponse(BaseModel):
    node: StoryNode
    state: GameState


class ChooseResponse(BaseModel):
    node: StoryNode
    state: GameState


class SaveResponse(BaseModel):
    success: bool
    message: Optional[str] = None
