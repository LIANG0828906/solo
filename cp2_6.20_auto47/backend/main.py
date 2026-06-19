from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.resume_service import (
    get_all_resumes,
    get_resume_by_id,
    create_resume,
    update_resume,
    delete_resume,
    init_sample_data,
)
from services.interview_service import (
    generate_interview,
    submit_answer,
    get_session_by_id,
    get_all_sessions,
)
from services.analysis_service import calculate_analysis

app = FastAPI(title="简历构建与面试模拟系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResumeCreate(BaseModel):
    title: str = "未命名简历"
    template: str = "business"
    sections: dict = {}


class ResumeUpdate(BaseModel):
    title: str | None = None
    template: str | None = None
    sections: dict | None = None


class InterviewGenerate(BaseModel):
    resumeId: str
    difficulty: str = "beginner"


class InterviewAnswer(BaseModel):
    sessionId: str
    questionId: str
    answer: str
    timeSpent: float


@app.on_event("startup")
def startup():
    init_sample_data()


@app.get("/api/resumes")
def list_resumes():
    resumes = get_all_resumes()
    return [r.model_dump() for r in resumes]


@app.get("/api/resumes/{resume_id}")
def get_resume(resume_id: str):
    resume = get_resume_by_id(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历未找到")
    return resume.model_dump()


@app.post("/api/resumes", status_code=201)
def create_resume_endpoint(data: ResumeCreate):
    resume = create_resume(data.model_dump())
    return resume.model_dump()


@app.put("/api/resumes/{resume_id}")
def update_resume_endpoint(resume_id: str, data: ResumeUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="没有提供更新数据")
    result = update_resume(resume_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="简历未找到")
    return result.model_dump()


@app.delete("/api/resumes/{resume_id}")
def delete_resume_endpoint(resume_id: str):
    success = delete_resume(resume_id)
    if not success:
        raise HTTPException(status_code=404, detail="简历未找到")
    return {"message": "删除成功"}


@app.post("/api/interview/generate", status_code=201)
def generate_interview_endpoint(data: InterviewGenerate):
    if data.difficulty not in ("beginner", "intermediate", "advanced"):
        raise HTTPException(status_code=400, detail="难度必须是 beginner、intermediate 或 advanced")
    try:
        session = generate_interview(data.resumeId, data.difficulty)
        return session.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/interview/answer")
def submit_answer_endpoint(data: InterviewAnswer):
    try:
        result = submit_answer(data.sessionId, data.questionId, data.answer, data.timeSpent)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/interview/history")
def interview_history():
    sessions = get_all_sessions()
    return [s.model_dump() for s in sessions]


@app.get("/api/interview/{session_id}")
def get_interview(session_id: str):
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="面试会话未找到")
    return session.model_dump()


@app.get("/api/analysis/{session_id}")
def get_analysis(session_id: str):
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="面试会话未找到")
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="面试尚未完成，无法生成分析报告")
    return calculate_analysis(session)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
