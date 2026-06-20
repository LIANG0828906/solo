import time
from typing import Dict, List, Optional, Tuple
from app.models import (
    SubmitRequest,
    SubmitResponse,
    StarRecord,
    RandomEventSubmitRequest,
    RandomEventSubmitResponse,
    StarEvent
)

game_state: Dict[str, Dict] = {}


def _get_state(session_id: str) -> Dict:
    if session_id not in game_state:
        game_state[session_id] = {
            "events": [],
            "current_index": 0,
            "current_event": None
        }
    return game_state[session_id]


def set_events(session_id: str, events: List[StarEvent]) -> None:
    state: Dict = _get_state(session_id)
    state["events"] = events
    state["current_index"] = 0
    if events:
        state["current_event"] = events[0]


def get_current_event(session_id: str) -> Optional[StarEvent]:
    state: Dict = _get_state(session_id)
    return state["current_event"]


def process_submission(
    request: SubmitRequest,
    cultivation: int,
    session_id: str = "default"
) -> Tuple[SubmitResponse, int]:
    state: Dict = _get_state(session_id)
    current_event: Optional[StarEvent] = state["current_event"]

    if current_event is None or current_event.id != request.eventId:
        return SubmitResponse(
            success=False,
            cultivationChange=0,
            newCultivation=cultivation,
            message="事件不存在或已过期",
            nextEvent=None,
            isXunEnd=False,
            starRecord=None
        ), cultivation

    is_correct: bool = (
        request.selectedStar == current_event.correctStar
        and request.selectedInscription == current_event.correctInscription
    )

    cultivation_change: int = 10 if is_correct else -5
    new_cultivation: int = max(0, cultivation + cultivation_change)

    message: str
    if is_correct:
        message = f"妙哉！{current_event.correctStar}宿与{current_event.correctInscription}铭相应，天象已平，修为+10"
    else:
        message = f"差矣！正确应为{current_event.correctStar}宿与{current_event.correctInscription}铭，天象未平，修为-5"

    star_record: StarRecord = StarRecord(
        eventId=request.eventId,
        success=is_correct,
        timestamp=time.time(),
        star=request.selectedStar,
        inscription=request.selectedInscription
    )

    state["current_index"] += 1
    next_event: Optional[StarEvent] = None
    is_xun_end: bool = False

    if state["current_index"] < len(state["events"]):
        next_event = state["events"][state["current_index"]]
        state["current_event"] = next_event
    else:
        state["current_event"] = None
        is_xun_end = True

    response: SubmitResponse = SubmitResponse(
        success=is_correct,
        cultivationChange=cultivation_change,
        newCultivation=new_cultivation,
        message=message,
        nextEvent=next_event,
        isXunEnd=is_xun_end,
        starRecord=star_record
    )

    return response, new_cultivation


def process_random_event(
    request: RandomEventSubmitRequest,
    cultivation: int
) -> Tuple[RandomEventSubmitResponse, int]:
    is_success: bool = request.success

    cultivation_change: int = 15 if is_success else -5
    new_cultivation: int = max(0, cultivation + cultivation_change)

    message: str
    if is_success:
        message = f"随机事件处理成功！天道感应，修为+{cultivation_change}"
    else:
        message = f"随机事件处理失败，天象紊乱，修为{cultivation_change}"

    response: RandomEventSubmitResponse = RandomEventSubmitResponse(
        success=is_success,
        cultivationChange=cultivation_change,
        newCultivation=new_cultivation,
        message=message
    )

    return response, new_cultivation
