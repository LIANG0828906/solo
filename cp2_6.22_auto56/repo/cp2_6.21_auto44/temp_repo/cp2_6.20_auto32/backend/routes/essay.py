import uuid
import time
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, HTTPException

from models.schemas import (
    EssaySubmission,
    SubmitEssayRequest,
    StatsResponse,
    GrammarError,
)
from services.grammar_checker import check_grammar_full, precheck_spelling_punctuation
from services.structure_analyzer import analyze_structure
from services.scoring_engine import calculate_scores


router = APIRouter(prefix="/essay", tags=["essay"])

submissions_db: List[EssaySubmission] = []


def init_mock_data():
    if submissions_db:
        return

    mock_contents = [
        {
            "title": "信息技术对教育的影响",
            "content": (
                "随着科技的飞速发展，教育领域也发生了深刻的变革。\n\n"
                "在线学习平台的兴起让知识获取变得更加便捷。学生们可以随时随地访问优质的教育资源，"
                "不受时间和空间的限制。人工智能技术也在辅助教学中发挥着重要作用，"
                "智能批改系统可以帮助教师减轻工作负担。\n\n"
                "然而，技术的发展也带来了一些挑战。过度依赖网络可能导致学生专注力下降。\n\n"
                "总之，我们需要在享受技术便利的同时，保持独立思考的能力。"
            ),
        },
        {
            "title": "我的理想",
            "content": (
                "每个人都有自己的理想，而我的理想是成为一名科学家。\n\n"
                "从小我就对科学充满了好奇。我喜欢观察自然现象，喜欢问为什么。"
                "因为所以我对科学的热爱，让我在学习中不断进步。\n\n"
                "为了实现这个理想，我努力学习科学知识，积极参加各种科技活动。"
                "虽然但是遇到了很多困难，但我从不放弃。\n\n"
                "我相信只要坚持努力，我的理想一定能够实现。"
            ),
        },
        {
            "title": "环境保护从我做起",
            "content": (
                "地球是我们共同的家园，保护环境是每个人的责任。\n\n"
                "在日常生活中，我们可以从点滴小事做起。节约用水、减少使用一次性用品、"
                "垃圾分类都是保护环境的有效方式。此外，我们还可以积极参与植树造林活动，"
                "为地球增添一抹绿色。\n\n"
                "环境保护不仅关乎当代人的生活质量，更关系到子孙后代的未来。\n\n"
                "让我们行动起来，共同守护我们美丽的地球家园。"
            ),
        },
    ]

    base_time = datetime.now()
    for i, mock in enumerate(mock_contents):
        content = mock["content"]
        errors = check_grammar_full(content)
        structure = analyze_structure(content)
        scores = calculate_scores(errors, structure, content, mock["title"])

        submission = EssaySubmission(
            id=f"essay-{i + 1}",
            title=mock["title"],
            content=content,
            submittedAt=(base_time - timedelta(days=i)).isoformat(),
            errors=errors,
            structure=structure,
            scores=scores,
        )
        submissions_db.append(submission)


init_mock_data()


@router.post("/submit", response_model=EssaySubmission)
async def submit_essay(request: SubmitEssayRequest):
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="作文内容不能为空")

    time.sleep(0.5)

    errors = check_grammar_full(request.content)
    structure = analyze_structure(request.content)
    scores = calculate_scores(errors, structure, request.content, request.title)

    submission = EssaySubmission(
        id=f"essay-{uuid.uuid4().hex[:8]}",
        title=request.title,
        content=request.content,
        submittedAt=datetime.now().isoformat(),
        errors=errors,
        structure=structure,
        scores=scores,
    )

    submissions_db.insert(0, submission)
    if len(submissions_db) > 50:
        submissions_db.pop()

    return submission


@router.get("/precheck", response_model=List[GrammarError])
async def precheck_essay(content: str):
    if not content.strip():
        return []

    errors = precheck_spelling_punctuation(content)
    return errors


@router.get("/list", response_model=List[EssaySubmission])
async def get_essay_list():
    return submissions_db


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    if not submissions_db:
        return StatsResponse(
            totalSubmissions=0,
            scoreDistribution={},
            errorTypeCount={},
            averageScore=0,
        )

    score_dist = {
        "90-100": 0,
        "80-89": 0,
        "70-79": 0,
        "60-69": 0,
        "0-59": 0,
    }

    error_count = {
        "spelling": 0,
        "punctuation": 0,
        "grammar": 0,
    }

    total_score = 0

    for sub in submissions_db:
        score = sub.scores.total
        if score >= 90:
            score_dist["90-100"] += 1
        elif score >= 80:
            score_dist["80-89"] += 1
        elif score >= 70:
            score_dist["70-79"] += 1
        elif score >= 60:
            score_dist["60-69"] += 1
        else:
            score_dist["0-59"] += 1

        total_score += score

        for err in sub.errors:
            if err.type in error_count:
                error_count[err.type] += 1

    avg_score = total_score / len(submissions_db) if submissions_db else 0

    return StatsResponse(
        totalSubmissions=len(submissions_db),
        scoreDistribution=score_dist,
        errorTypeCount=error_count,
        averageScore=round(avg_score, 1),
    )


@router.get("/history", response_model=List[EssaySubmission])
async def get_history(limit: int = 10):
    return submissions_db[:limit]
