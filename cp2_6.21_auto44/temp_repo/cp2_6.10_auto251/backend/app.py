from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict

from models.schemas import (
    GenerateTaskRequest,
    SubmitAnswerRequest,
    ScoreResponse,
    TriggerEventRequest,
    ResolveEventRequest,
    ResolveEventResponse,
    EndPeriodRequest,
    EndPeriodResponse,
    Task,
    GameEvent,
    ScoreGrade
)
from services.task_generator import TaskGenerator
from services.scoring_service import ScoringService
from services.event_service import EventService


task_generator: TaskGenerator = None
scoring_service: ScoringService = None
event_service: EventService = None
active_tasks: Dict[int, Task] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global task_generator, scoring_service, event_service
    task_generator = TaskGenerator()
    scoring_service = ScoringService()
    event_service = EventService()
    yield
    active_tasks.clear()


app = FastAPI(
    title="中医问诊模拟游戏 API",
    description="基于20种常见草药的中医知识问答游戏后端",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate_task", response_model=Task, summary="生成新任务")
async def generate_task(request: GenerateTaskRequest):
    scoring_service.update_day(request.period, request.day)
    task = task_generator.generate_task(request.period, request.day)
    active_tasks[task.id] = task
    return task


@app.post("/api/submit_answer", summary="提交答案")
async def submit_answer(request: SubmitAnswerRequest):
    task = active_tasks.get(request.task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    
    is_correct, score_change, message = scoring_service.submit_answer(
        task=task,
        selected_herb_id=request.selected_herb_id,
        response_time=request.response_time
    )
    
    del active_tasks[request.task_id]
    
    return {
        "success": True,
        "is_correct": is_correct,
        "score_change": round(score_change, 1),
        "message": message,
        "correct_herb_id": task.correct_herb_id
    }


@app.get("/api/get_score", response_model=ScoreResponse, summary="获取当前分数")
async def get_score(period: int = None, day: int = None):
    return scoring_service.get_score(period=period, day=day)


@app.post("/api/trigger_event", response_model=GameEvent, summary="触发随机事件")
async def trigger_event(request: TriggerEventRequest):
    scoring_service.update_day(request.period, request.day)
    event = event_service.trigger_event(request.period, request.day)
    if event is None:
        raise HTTPException(status_code=500, detail="事件生成失败")
    return event


@app.post("/api/resolve_event", response_model=ResolveEventResponse, summary="处理事件")
async def resolve_event(request: ResolveEventRequest):
    result = event_service.resolve_event(request.event_id, request.selected_option)
    if result is None:
        raise HTTPException(status_code=404, detail="事件不存在或已处理")
    
    scoring_service.adjust_score(result.score_change)
    
    return result


@app.post("/api/end_period", response_model=EndPeriodResponse, summary="结束本旬")
async def end_period(request: EndPeriodRequest):
    final_score, grade, summary = scoring_service.end_period(request.period)
    
    return EndPeriodResponse(
        period=request.period,
        total_days=scoring_service.DAYS_PER_PERIOD,
        score=round(final_score, 1),
        grade=grade,
        summary=summary
    )


@app.get("/api/herbs", summary="获取所有草药列表")
async def get_all_herbs():
    return {
        "count": len(task_generator.herbs),
        "herbs": task_generator.herbs
    }


@app.get("/api/herb/{herb_id}", summary="获取单味草药详情")
async def get_herb(herb_id: int):
    herb = task_generator.get_herb_by_id(herb_id)
    if herb is None:
        raise HTTPException(status_code=404, detail="草药不存在")
    return herb


@app.get("/api/health", summary="健康检查")
async def health_check():
    return {
        "status": "healthy",
        "herbs_loaded": len(task_generator.herbs),
        "active_tasks": len(active_tasks),
        "active_events": len(event_service.get_all_active_events())
    }


@app.post("/api/reset", summary="重置游戏")
async def reset_game():
    scoring_service.reset()
    event_service.reset()
    active_tasks.clear()
    return {"message": "游戏已重置"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
