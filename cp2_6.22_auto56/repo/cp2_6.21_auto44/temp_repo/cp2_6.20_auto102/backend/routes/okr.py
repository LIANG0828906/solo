import uuid
from fastapi import APIRouter, HTTPException
from ..database import objectives_db
from ..models import ObjectiveCreate, ObjectiveUpdate, ObjectiveMove, KeyResultBase
from .websocket import manager

router = APIRouter()


def calculate_progress(key_results: list[dict]) -> float:
    if not key_results:
        return 0.0
    total_weight = sum(kr["weight"] for kr in key_results)
    if total_weight == 0:
        return 0.0
    weighted_sum = sum(
        (kr["currentValue"] / kr["targetValue"]) * kr["weight"]
        for kr in key_results
        if kr["targetValue"] != 0
    )
    progress = (weighted_sum / total_weight) * 100
    return max(0.0, min(100.0, progress))


@router.get("/objectives")
def get_objectives():
    return list(objectives_db.values())


@router.post("/objectives")
async def create_objective(obj_in: ObjectiveCreate):
    obj_id = uuid.uuid4().hex[:8]
    obj_data = {
        "id": obj_id,
        "name": obj_in.name,
        "level": obj_in.level,
        "parentId": obj_in.parentId,
        "progress": 0.0,
        "keyResults": [],
    }
    objectives_db[obj_id] = obj_data
    await manager.broadcast({
        "event": "objective_created",
        "data": obj_data,
        "user": "用户",
    })
    return obj_data


@router.put("/objectives/{objective_id}")
async def update_objective(objective_id: str, obj_in: ObjectiveUpdate):
    if objective_id not in objectives_db:
        raise HTTPException(status_code=404, detail="Objective not found")
    obj = objectives_db[objective_id]
    if obj_in.name is not None:
        obj["name"] = obj_in.name
    if obj_in.level is not None:
        obj["level"] = obj_in.level
    if obj_in.parentId is not None:
        obj["parentId"] = obj_in.parentId
    if obj_in.keyResults is not None:
        obj["keyResults"] = [kr.model_dump() for kr in obj_in.keyResults]
        obj["progress"] = calculate_progress(obj["keyResults"])
    await manager.broadcast({
        "event": "objective_updated",
        "data": obj,
        "user": "用户",
    })
    return obj


@router.delete("/objectives/{objective_id}")
async def delete_objective(objective_id: str):
    if objective_id not in objectives_db:
        raise HTTPException(status_code=404, detail="Objective not found")
    obj = objectives_db.pop(objective_id)
    await manager.broadcast({
        "event": "objective_deleted",
        "data": obj,
        "user": "用户",
    })
    return {"detail": "deleted"}


@router.put("/objectives/{objective_id}/move")
async def move_objective(objective_id: str, move_in: ObjectiveMove):
    if objective_id not in objectives_db:
        raise HTTPException(status_code=404, detail="Objective not found")
    obj = objectives_db[objective_id]
    obj["parentId"] = move_in.parentId
    await manager.broadcast({
        "event": "objective_updated",
        "data": obj,
        "user": "用户",
    })
    return obj
