from fastapi import APIRouter, HTTPException
from ..database import milestones_db
from ..models import MilestoneBase, MilestoneUpdate
from .websocket import manager

router = APIRouter()


@router.get("/milestones")
def get_milestones():
    return list(milestones_db.values())


@router.put("/milestones/{milestone_id}")
async def update_milestone(milestone_id: str, ms_in: MilestoneUpdate):
    if milestone_id not in milestones_db:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if ms_in.progress < 0 or ms_in.progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    ms = milestones_db[milestone_id]
    ms["progress"] = ms_in.progress
    await manager.broadcast({
        "event": "milestone_updated",
        "data": ms,
        "user": "用户",
    })
    return ms
