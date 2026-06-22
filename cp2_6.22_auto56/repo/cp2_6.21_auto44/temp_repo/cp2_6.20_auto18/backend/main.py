from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
import shutil
from datetime import datetime
import math

app = FastAPI(title="异步面试评估系统 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

interviews_db = {}
evaluations_db = {}
chunks_db = {}


class InterviewQuestion(BaseModel):
    id: Optional[str] = None
    text: str
    duration: int


class Interview(BaseModel):
    id: str
    title: str
    questions: List[InterviewQuestion]
    candidateEmail: str
    candidateName: Optional[str] = None
    status: str = "pending"
    createdAt: str
    inviteLink: str


class CreateInterviewRequest(BaseModel):
    title: str
    questions: List[InterviewQuestion]
    candidateEmail: str


class CreateInterviewResponse(BaseModel):
    success: bool
    interview: Interview
    inviteLink: str
    emailSent: bool


class VerifyCandidateRequest(BaseModel):
    interviewId: str
    name: str
    email: str


class VerifyCandidateResponse(BaseModel):
    success: bool
    interview: Interview
    token: str


class ScoreItem(BaseModel):
    questionId: str
    score: int
    comment: Optional[str] = None


class VoiceComment(BaseModel):
    id: str
    evaluatorId: str
    evaluatorName: str
    audioUrl: str
    duration: float
    createdAt: str
    waveformData: List[float]


class SubmitEvaluationRequest(BaseModel):
    interviewId: str
    scores: List[ScoreItem]
    voiceComments: Optional[List[VoiceComment]] = []


class SubmitEvaluationResponse(BaseModel):
    success: bool
    evaluationId: str


class EvaluationDimensions(BaseModel):
    expression: float
    logic: float
    technicalDepth: float
    adaptability: float
    timeManagement: float


class EvaluationResult(BaseModel):
    id: str
    interviewId: str
    evaluatorName: str
    scores: List[ScoreItem]
    averageScore: float
    totalScore: float
    voiceComments: List[VoiceComment]
    dimensions: EvaluationDimensions


def generate_mock_evaluations(interview_id: str) -> List[EvaluationResult]:
    evaluators = ["张经理", "李主管", "王组长"]
    results = []

    for i, name in enumerate(evaluators):
        scores = []
        for j, q_id in enumerate([f"q{j+1}" for j in range(3)]):
            scores.append(ScoreItem(
                questionId=q_id,
                score=7 + i + j,
                comment=f"{name}对第{j+1}题的评价：候选人回答思路清晰，表达流畅。"
            ))

        avg_score = sum(s.score for s in scores) / len(scores)
        total_score = sum(s.score for s in scores)

        results.append(EvaluationResult(
            id=f"eval-{i+1}",
            interviewId=interview_id,
            evaluatorName=name,
            scores=scores,
            averageScore=round(avg_score, 1),
            totalScore=total_score,
            voiceComments=[
                VoiceComment(
                    id=f"vc-{i}-1",
                    evaluatorId=f"eval-{i}",
                    evaluatorName=name,
                    audioUrl="/uploads/sample.mp3",
                    duration=30 + i * 10,
                    createdAt=datetime.now().isoformat(),
                    waveformData=[0.3 + (abs(math.sin(x + i)) * 0.7) for x in range(30)]
                )
            ] if i < 2 else [],
            dimensions=EvaluationDimensions(
                expression=7.5 + i * 0.5,
                logic=8.0 + i * 0.3,
                technicalDepth=7.0 + i * 0.6,
                adaptability=6.5 + i * 0.8,
                timeManagement=8.0 + i * 0.2
            )
        ))

    return results


@app.get("/api/interviews", response_model=List[Interview])
async def get_interviews():
    if not interviews_db:
        mock_questions = [
            InterviewQuestion(id="q1", text="请介绍一下你自己以及你的技术背景。", duration=120),
            InterviewQuestion(id="q2", text="请描述一个你最有成就感的项目，以及你在其中的角色。", duration=180),
            InterviewQuestion(id="q3", text="遇到技术难题时，你是如何解决的？请举例说明。", duration=150),
        ]
        mock_interview = Interview(
            id="interview-001",
            title="前端工程师初面",
            questions=mock_questions,
            candidateEmail="candidate@example.com",
            candidateName="张三",
            status="completed",
            createdAt=datetime.now().isoformat(),
            inviteLink="http://localhost:3000/interview/interview-001/record"
        )
        interviews_db[mock_interview.id] = mock_interview
        evaluations_db[mock_interview.id] = generate_mock_evaluations(mock_interview.id)

        mock_interview2 = Interview(
            id="interview-002",
            title="后端工程师面试",
            questions=[
                InterviewQuestion(id="q1", text="请介绍一下你的后端开发经验。", duration=120),
                InterviewQuestion(id="q2", text="说说你对数据库优化的理解。", duration=150),
                InterviewQuestion(id="q3", text="如何设计高并发系统？", duration=180),
                InterviewQuestion(id="q4", text="你最擅长的技术栈是什么？", duration=90),
            ],
            candidateEmail="dev@example.com",
            candidateName="李四",
            status="evaluated",
            createdAt=datetime.now().isoformat(),
            inviteLink="http://localhost:3000/interview/interview-002/record"
        )
        interviews_db[mock_interview2.id] = mock_interview2
        evaluations_db[mock_interview2.id] = generate_mock_evaluations(mock_interview2.id)

    return list(interviews_db.values())


@app.get("/api/interviews/{interview_id}", response_model=Interview)
async def get_interview(interview_id: str):
    if interview_id not in interviews_db:
        if not interviews_db:
            await get_interviews()
        if interview_id not in interviews_db:
            mock_questions = [
                InterviewQuestion(id="q1", text="请介绍一下你自己以及你的技术背景。", duration=120),
                InterviewQuestion(id="q2", text="请描述一个你最有成就感的项目。", duration=180),
                InterviewQuestion(id="q3", text="遇到技术难题时你是如何解决的？", duration=150),
            ]
            return Interview(
                id=interview_id,
                title="面试评估",
                questions=mock_questions,
                candidateEmail="candidate@example.com",
                status="pending",
                createdAt=datetime.now().isoformat(),
                inviteLink=f"http://localhost:3000/interview/{interview_id}/record"
            )

    return interviews_db[interview_id]


@app.post("/api/interviews", response_model=CreateInterviewResponse)
async def create_interview(request: CreateInterviewRequest):
    interview_id = str(uuid.uuid4())

    questions = []
    for i, q in enumerate(request.questions):
        questions.append(InterviewQuestion(
            id=f"q{i+1}",
            text=q.text,
            duration=q.duration
        ))

    interview = Interview(
        id=interview_id,
        title=request.title,
        questions=questions,
        candidateEmail=request.candidateEmail,
        status="pending",
        createdAt=datetime.now().isoformat(),
        inviteLink=f"http://localhost:3000/interview/{interview_id}/record"
    )

    interviews_db[interview_id] = interview
    evaluations_db[interview_id] = []

    return CreateInterviewResponse(
        success=True,
        interview=interview,
        inviteLink=interview.inviteLink,
        emailSent=True
    )


@app.post("/api/candidates/verify", response_model=VerifyCandidateResponse)
async def verify_candidate(request: VerifyCandidateRequest):
    interview_id = request.interviewId

    if interview_id not in interviews_db:
        mock_questions = [
            InterviewQuestion(id="q1", text="请介绍一下你自己以及你的技术背景。", duration=60),
            InterviewQuestion(id="q2", text="请描述一个你最有成就感的项目。", duration=90),
            InterviewQuestion(id="q3", text="遇到技术难题时你是如何解决的？", duration=90),
        ]
        interviews_db[interview_id] = Interview(
            id=interview_id,
            title="技术面试",
            questions=mock_questions,
            candidateEmail=request.email,
            candidateName=request.name,
            status="in_progress",
            createdAt=datetime.now().isoformat(),
            inviteLink=f"http://localhost:3000/interview/{interview_id}/record"
        )

    interview = interviews_db[interview_id]
    interview.candidateName = request.name
    interview.status = "in_progress"

    token = str(uuid.uuid4())

    return VerifyCandidateResponse(
        success=True,
        interview=interview,
        token=token
    )


@app.post("/api/upload/chunk")
async def upload_chunk(
    file: UploadFile = File(...),
    chunkIndex: int = Form(...),
    totalChunks: int = Form(...),
    fileName: str = Form(...),
    interviewId: str = Form(...),
    questionId: str = Form(...)
):
    chunk_key = f"{interviewId}_{questionId}_{fileName}"

    if chunk_key not in chunks_db:
        chunks_db[chunk_key] = {}

    chunk_data = await file.read()
    chunks_db[chunk_key][chunkIndex] = chunk_data

    return {"success": True, "chunkIndex": chunkIndex, "uploaded": True}


@app.post("/api/upload/complete")
async def complete_upload(
    interviewId: str = Form(...),
    questionId: str = Form(...),
    fileName: str = Form(...),
    totalChunks: int = Form(...)
):
    chunk_key = f"{interviewId}_{questionId}_{fileName}"

    if chunk_key not in chunks_db:
        raise HTTPException(status_code=400, detail="No chunks found")

    if len(chunks_db[chunk_key]) != totalChunks:
        raise HTTPException(status_code=400, detail="Missing chunks")

    file_path = os.path.join(UPLOAD_DIR, fileName)

    with open(file_path, "wb") as f:
        for i in range(totalChunks):
            f.write(chunks_db[chunk_key][i])

    del chunks_db[chunk_key]

    video_url = f"/uploads/{fileName}"

    if interviewId in interviews_db:
        interviews_db[interviewId].status = "completed"

    return {"success": True, "videoUrl": video_url}


@app.post("/api/upload/voice")
async def upload_voice(
    file: UploadFile = File(...),
    interviewId: str = Form(...)
):
    file_id = str(uuid.uuid4())
    file_name = f"voice_{file_id}.webm"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    waveform_data = [0.3 + (abs(math.sin(x)) * 0.7) for x in range(30)]

    return {
        "url": f"/uploads/{file_name}",
        "waveformData": waveform_data
    }


@app.post("/api/evaluations", response_model=SubmitEvaluationResponse)
async def submit_evaluation(request: SubmitEvaluationRequest):
    evaluation_id = str(uuid.uuid4())

    avg_score = sum(s.score for s in request.scores) / len(request.scores) if request.scores else 0
    total_score = sum(s.score for s in request.scores)

    base_score = avg_score / 10
    dimensions = EvaluationDimensions(
        expression=round(5 + base_score * 3 + 0.5, 1),
        logic=round(5 + base_score * 3.5, 1),
        technicalDepth=round(4 + base_score * 4, 1),
        adaptability=round(5 + base_score * 3, 1),
        timeManagement=round(6 + base_score * 2.5, 1)
    )

    evaluation = EvaluationResult(
        id=evaluation_id,
        interviewId=request.interviewId,
        evaluatorName="评估员",
        scores=request.scores,
        averageScore=round(avg_score, 1),
        totalScore=total_score,
        voiceComments=request.voiceComments or [],
        dimensions=dimensions
    )

    if request.interviewId not in evaluations_db:
        evaluations_db[request.interviewId] = []

    evaluations_db[request.interviewId].append(evaluation)

    if request.interviewId in interviews_db:
        interviews_db[request.interviewId].status = "evaluated"

    return SubmitEvaluationResponse(
        success=True,
        evaluationId=evaluation_id
    )


@app.get("/api/evaluations", response_model=List[EvaluationResult])
async def get_evaluations(interviewId: str):
    if interviewId not in evaluations_db or not evaluations_db[interviewId]:
        if interviewId not in interviews_db:
            await get_interviews()
        evaluations_db[interviewId] = generate_mock_evaluations(interviewId)

    return evaluations_db[interviewId]


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
