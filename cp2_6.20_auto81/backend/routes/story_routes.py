import time
import uuid
from typing import Dict, List
from fastapi import APIRouter, HTTPException

from models.story_model import (
    StartStoryRequest,
    ChooseRequest,
    StartStoryResponse,
    ChooseResponse,
    SaveData,
    SaveResponse,
    GameState,
    StoryNode,
    HistoryEntry,
)
from engine.narrative_engine import NarrativeEngine

router = APIRouter()

saves_db: Dict[str, SaveData] = {}
engine = NarrativeEngine()


@router.post("/start", response_model=StartStoryResponse)
async def start_story(request: StartStoryRequest):
    try:
        initial_state = GameState()
        start_node = engine.get_start_node(request.theme)
        initial_state.currentNodeId = start_node.id
        initial_state.history.append(
            HistoryEntry(node_id=start_node.id, timestamp=int(time.time() * 1000))
        )
        return StartStoryResponse(node=start_node, state=initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/choose", response_model=ChooseResponse)
async def choose_option(request: ChooseRequest):
    try:
        if request.choice_id == "__load__":
            node = engine.get_node_by_id(request.current_node_id)
            return ChooseResponse(node=node, state=request.state)

        next_node, new_state = engine.process_choice(
            request.current_node_id, request.choice_id, request.state
        )
        new_state.history.append(
            HistoryEntry(
                node_id=next_node.id,
                choice_id=request.choice_id,
                timestamp=int(time.time() * 1000),
            )
        )
        if next_node.end:
            new_state.isEnded = True
        return ChooseResponse(node=next_node, state=new_state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save", response_model=SaveResponse)
async def save_game(save_data: SaveData):
    try:
        if not save_data.id:
            save_data.id = str(uuid.uuid4())
        saves_db[save_data.id] = save_data
        return SaveResponse(success=True, message="Game saved successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/load/{save_id}", response_model=SaveData)
async def load_game(save_id: str):
    if save_id not in saves_db:
        raise HTTPException(status_code=404, detail="Save not found")
    return saves_db[save_id]


@router.get("/saves", response_model=List[SaveData])
async def list_saves():
    return sorted(saves_db.values(), key=lambda s: s.timestamp, reverse=True)
