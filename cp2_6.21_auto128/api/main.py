import asyncio
import random
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="会议录音转写API", version="1.0.0")

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
    message: str


class TranscribeStatusResponse(BaseModel):
    taskId: str
    status: str
    progress: float
    result: TranscriptResult | None = None


transcript_tasks: Dict[str, dict] = {}


def generate_mock_transcript() -> TranscriptResult:
    speaker_count = 3
    speakers = []

    for i in range(speaker_count):
        speakers.append(
            Speaker(
                id=f"speaker-{i}",
                name=f"说话人{chr(65 + i)}",
                color=SPEAKER_COLORS[i % len(SPEAKER_COLORS)],
            )
        )

    sentences = []
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


@app.post("/api/upload", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    if not file.filename.lower().endswith(('.mp3', '.wav')):
        raise HTTPException(status_code=400, detail="只支持MP3和WAV格式")

    file_size = 0
    chunk = await file.read(1024 * 1024)
    while chunk:
        file_size += len(chunk)
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小不能超过50MB")
        chunk = await file.read(1024 * 1024)

    task_id = str(uuid.uuid4())

    transcript_tasks[task_id] = {
        "status": "pending",
        "progress": 0,
        "result": None,
        "filename": file.filename,
    }

    asyncio.create_task(process_transcription(task_id))

    return UploadResponse(
        taskId=task_id,
        message="文件上传成功，开始转写",
    )


async def process_transcription(task_id: str):
    transcript_tasks[task_id]["status"] = "processing"

    total_steps = 20
    for i in range(total_steps):
        await asyncio.sleep(0.1 + random.random() * 0.1)
        progress = ((i + 1) / total_steps) * 100
        transcript_tasks[task_id]["progress"] = round(progress, 1)

    result = generate_mock_transcript()
    transcript_tasks[task_id]["status"] = "completed"
    transcript_tasks[task_id]["result"] = result


@app.get("/api/transcribe/{task_id}", response_model=TranscribeStatusResponse)
async def get_transcribe_status(task_id: str):
    task = transcript_tasks.get(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    return TranscribeStatusResponse(
        taskId=task_id,
        status=task["status"],
        progress=task["progress"],
        result=task["result"],
    )


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "转写服务运行中"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
