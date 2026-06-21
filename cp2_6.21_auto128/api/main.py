import asyncio
import random
import uuid
import time
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from enum import Enum

app = FastAPI(title="会议录音转写API", version="1.0.0", description="模拟音频转写服务API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SPEAKER_COLORS = ["#e3f2fd", "#fff3e0", "#e8f5e9", "#f3e5f5", "#fff9c4"]

MOCK_SENTENCES = [
    "大家好，今天我们来讨论一下新产品的开发计划。",
    "首先，我想介绍一下市场调研的结果。",
    "根据我们的数据，用户对移动端的需求增长很快。",
    "是的，我也注意到了这个趋势。",
    "那我们是不是应该优先开发移动端版本？",
    "我觉得可以，但是也要考虑到现有用户的体验。",
    "说得对，我们不能牺牲桌面端的质量。",
    "我的建议是双管齐下，两个平台同时推进。",
    "那资源够吗？团队现在的工作量已经很大了。",
    "我们可以考虑招聘一些新的成员。",
    "或者，也可以把一些非核心功能外包出去。",
    "外包的话，质量怎么保证呢？",
    "我们可以制定严格的验收标准。",
    "我觉得还是内部开发更稳妥一些。",
    "这样吧，我们先做一个详细的评估报告。",
    "好的，那谁来负责这个评估？",
    "我来吧，我对这方面比较熟悉。",
    "那就辛苦你了，预计什么时候能出结果？",
    "大概需要一周的时间。",
    "行，那就下周五之前给我们汇报。",
    "好的，没问题。",
    "还有其他事情要讨论吗？",
    "我想提一下用户反馈的问题。",
    "最近收到一些用户说界面太复杂了。",
    "这个问题确实存在，我们需要简化一下。",
    "我同意，应该做一些用户体验优化。",
    "那我们安排一下，下周开个专题会议讨论。",
    "好的，我来安排时间。",
    "还有，关于数据分析的功能，用户呼声很高。",
    "这个功能我们已经在规划中了。",
    "大概什么时候能上线？",
    "预计下个季度吧。",
    "能不能提前一些？很多用户都在问。",
    "我尽量吧，但质量还是第一位的。",
    "理解，那就拜托你们了。",
    "好的，我们会尽力的。",
    "今天的会议就到这里吧，大家还有问题吗？",
    "没有了。",
    "好，散会。",
]


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


class Speaker(BaseModel):
    id: str
    name: str
    color: str
    note: str = ""


class TranscriptSentence(BaseModel):
    id: str
    speakerId: str
    text: str
    startTime: float
    endTime: float


class TranscriptResult(BaseModel):
    sentences: List[TranscriptSentence]
    speakers: List[Speaker]
    duration: float


class UploadResponse(BaseModel):
    taskId: str
    filename: str
    status: TaskStatus
    message: str


class TranscribeStatusResponse(BaseModel):
    taskId: str
    status: TaskStatus
    progress: float
    filename: str
    createdAt: float
    result: Optional[TranscriptResult] = None
    error: Optional[str] = None


class TaskInfo:
    def __init__(self, task_id: str, filename: str):
        self.task_id = task_id
        self.filename = filename
        self.status = TaskStatus.PENDING
        self.progress = 0.0
        self.result: Optional[TranscriptResult] = None
        self.error: Optional[str] = None
        self.created_at = time.time()
        self.updated_at = time.time()


transcript_tasks: Dict[str, TaskInfo] = {}
TASK_TIMEOUT = 300
MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {'.mp3', '.wav'}


def generate_mock_transcript() -> TranscriptResult:
    speaker_count = 3
    speakers: List[Speaker] = []

    for i in range(speaker_count):
        speakers.append(
            Speaker(
                id=f"speaker-{i}",
                name=f"说话人{chr(65 + i)}",
                color=SPEAKER_COLORS[i % len(SPEAKER_COLORS)],
            )
        )

    sentences: List[TranscriptSentence] = []
    current_time = 0.0

    for index, text in enumerate(MOCK_SENTENCES):
        speaker_index = index % speaker_count
        duration = 3 + random.random() * 4
        start_time = current_time
        end_time = current_time + duration

        sentences.append(
            TranscriptSentence(
                id=f"sentence-{index}",
                speakerId=speakers[speaker_index].id,
                text=text,
                startTime=round(start_time, 1),
                endTime=round(end_time, 1),
            )
        )

        current_time = end_time + 0.5

    return TranscriptResult(
        sentences=sentences,
        speakers=speakers,
        duration=round(current_time, 1),
    )


async def process_transcription(task_id: str):
    task = transcript_tasks.get(task_id)
    if not task:
        return

    try:
        task.status = TaskStatus.PROCESSING
        task.updated_at = time.time()

        total_steps = 25
        for i in range(total_steps):
            await asyncio.sleep(0.08 + random.random() * 0.08)
            task.progress = round(((i + 1) / total_steps) * 100, 1)
            task.updated_at = time.time()

            if task.progress < 30:
                pass
            elif task.progress < 60:
                pass
            else:
                pass

        result = generate_mock_transcript()
        task.result = result
        task.status = TaskStatus.COMPLETED
        task.progress = 100.0
        task.updated_at = time.time()

    except asyncio.CancelledError:
        task.status = TaskStatus.FAILED
        task.error = "转写任务被取消"
        task.updated_at = time.time()
    except Exception as e:
        task.status = TaskStatus.FAILED
        task.error = f"转写失败: {str(e)}"
        task.updated_at = time.time()


def cleanup_tasks():
    now = time.time()
    expired_tasks = [
        task_id
        for task_id, task in transcript_tasks.items()
        if now - task.created_at > TASK_TIMEOUT
    ]
    for task_id in expired_tasks:
        task = transcript_tasks[task_id]
        if task.status not in (TaskStatus.COMPLETED, TaskStatus.FAILED):
            task.status = TaskStatus.TIMEOUT
            task.error = "任务超时"
        if now - task.created_at > TASK_TIMEOUT * 2:
            del transcript_tasks[task_id]


@app.post("/api/upload", response_model=UploadResponse)
async def upload_audio(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    cleanup_tasks()

    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    file_ext = file.filename[file.filename.rfind('.'):].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式，仅支持: {', '.join(ALLOWED_EXTENSIONS)}")

    file_size = 0
    chunk_size = 1024 * 1024

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"文件大小不能超过{MAX_FILE_SIZE // (1024*1024)}MB")

    task_id = str(uuid.uuid4())
    task_info = TaskInfo(task_id, file.filename)
    transcript_tasks[task_id] = task_info

    background_tasks.add_task(process_transcription, task_id)

    return UploadResponse(
        taskId=task_id,
        filename=file.filename,
        status=TaskStatus.PENDING,
        message="文件上传成功，转写任务已创建",
    )


@app.get("/api/transcribe/{task_id}", response_model=TranscribeStatusResponse)
async def get_transcribe_status(task_id: str):
    cleanup_tasks()

    task = transcript_tasks.get(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")

    return TranscribeStatusResponse(
        taskId=task.task_id,
        status=task.status,
        progress=task.progress,
        filename=task.filename,
        createdAt=task.created_at,
        result=task.result,
        error=task.error,
    )


@app.get("/api/tasks")
async def list_tasks(limit: int = 10):
    cleanup_tasks()

    tasks = sorted(
        transcript_tasks.values(),
        key=lambda t: t.created_at,
        reverse=True
    )[:limit]

    return {
        "total": len(transcript_tasks),
        "tasks": [
            {
                "taskId": t.task_id,
                "status": t.status,
                "progress": t.progress,
                "filename": t.filename,
                "createdAt": t.created_at,
            }
            for t in tasks
        ],
    }


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id in transcript_tasks:
        del transcript_tasks[task_id]
        return {"message": "任务已删除"}
    raise HTTPException(status_code=404, detail="任务不存在")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "meeting-transcript-api",
        "version": "1.0.0",
        "activeTasks": len(transcript_tasks),
        "timestamp": time.time(),
    }


@app.get("/")
async def root():
    return {
        "name": "会议录音转写API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /api/upload",
            "status": "GET /api/transcribe/{task_id}",
            "list": "GET /api/tasks",
            "delete": "DELETE /api/tasks/{task_id}",
            "health": "GET /api/health",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
