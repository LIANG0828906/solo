from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from typing import Optional, List
from backend.models.schemas import Essay, EssayCreate
from backend.services import essay_service

router = APIRouter(prefix="/api/essays", tags=["essays"])


@router.get("")
async def get_essays(classId: str = Query(..., alias="classId")):
    data = essay_service.get_essays_by_class(classId)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/{essay_id}")
async def get_essay(essay_id: str):
    data = essay_service.get_essay_by_id(essay_id)
    if not data:
        raise HTTPException(status_code=404, detail="Essay not found")
    return {"code": 200, "data": data, "message": "success"}


@router.post("")
async def create_essay(data: EssayCreate):
    result = essay_service.create_essay(data)
    return {"code": 200, "data": result, "message": "作文创建成功"}


@router.post("/upload")
async def upload_essay(file: UploadFile = File(...), classId: str = "", studentName: str = "", title: str = ""):
    content = await file.read()
    text_content = content.decode("utf-8", errors="ignore")
    file_path = await essay_service.save_uploaded_file(file.filename, content)
    essay_data = EssayCreate(
        classId=classId,
        studentName=studentName,
        title=title or file.filename,
        content=text_content,
    )
    result = essay_service.create_essay(essay_data)
    result["filePath"] = file_path
    return {"code": 200, "data": result, "message": "上传成功"}
