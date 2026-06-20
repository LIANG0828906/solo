from fastapi import APIRouter, HTTPException, Query
from typing import List
from backend.models.schemas import CommentCreate, PresetCommentCreate
from backend.services import comment_service

router = APIRouter(prefix="/api", tags=["comments"])


@router.get("/comments")
async def get_comments(essayId: str = Query(..., alias="essayId")):
    data = comment_service.get_comments_by_essay(essayId)
    return {"code": 200, "data": data, "message": "success"}


@router.post("/comments")
async def create_comment(data: CommentCreate):
    result = comment_service.create_comment(data)
    return {"code": 200, "data": result, "message": "评语添加成功"}


@router.put("/comments/{comment_id}")
async def update_comment(comment_id: str, data: dict):
    result = comment_service.update_comment(comment_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"code": 200, "data": result, "message": "评语更新成功"}


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str):
    success = comment_service.delete_comment(comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"code": 200, "data": None, "message": "评语删除成功"}


@router.get("/preset-comments")
async def get_preset_comments():
    data = comment_service.get_preset_comments()
    return {"code": 200, "data": data, "message": "success"}


@router.post("/preset-comments")
async def create_preset_comment(data: PresetCommentCreate):
    result = comment_service.create_preset_comment(data)
    return {"code": 200, "data": result, "message": "预设评语添加成功"}


@router.post("/comments/presets/add")
async def add_preset_comment_alias(data: PresetCommentCreate):
    result = comment_service.create_preset_comment(data)
    return {"code": 200, "data": result, "message": "预设评语添加成功"}


@router.delete("/preset-comments/{preset_id}")
async def delete_preset_comment(preset_id: str):
    success = comment_service.delete_preset_comment(preset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Preset comment not found")
    return {"code": 200, "data": None, "message": "预设评语删除成功"}
