from fastapi import APIRouter, HTTPException
from typing import List
from backend.models.schemas import Class, ClassCreate
from backend.services import class_service

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("")
async def get_classes():
    data = class_service.get_all_classes()
    return {"code": 200, "data": data, "message": "success"}


@router.get("/{class_id}")
async def get_class(class_id: str):
    data = class_service.get_class_by_id(class_id)
    if not data:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"code": 200, "data": data, "message": "success"}


@router.post("")
async def create_class(data: ClassCreate):
    result = class_service.create_class(data)
    return {"code": 200, "data": result, "message": "班级创建成功"}
