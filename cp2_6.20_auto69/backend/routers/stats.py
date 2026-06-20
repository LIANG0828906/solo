from fastapi import APIRouter, Query
from backend.models.schemas import ScoreCreate
from backend.services import stats_service

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats/overview")
async def get_overview(classId: str = Query(..., alias="classId")):
    data = stats_service.get_overview(classId)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/stats/dimensions")
async def get_dimensions(classId: str = Query(..., alias="classId")):
    data = stats_service.get_dimension_stats(classId)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/stats/distribution")
async def get_distribution(classId: str = Query(..., alias="classId")):
    data = stats_service.get_distribution(classId)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/stats/student/{essay_id}")
async def get_student_radar(essay_id: str):
    data = stats_service.get_student_radar(essay_id)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/scores")
async def get_score(essayId: str = Query(..., alias="essayId")):
    data = stats_service.get_score_by_essay(essayId)
    return {"code": 200, "data": data, "message": "success"}


@router.post("/scores")
async def submit_score(data: ScoreCreate):
    result = stats_service.submit_score(data)
    return {"code": 200, "data": result, "message": "评分提交成功"}
