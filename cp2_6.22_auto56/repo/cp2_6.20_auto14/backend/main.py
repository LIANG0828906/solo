import json
import os
import random
import time
from functools import lru_cache
from pathlib import Path
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "question_bank.json"

app = FastAPI(title="自适应学习路径生成器 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

question_bank = None
question_index = None
path_cache: Dict[str, Dict[str, Any]] = {}
PATH_CACHE_TTL = 5000


def load_question_bank():
    global question_bank, question_index
    if question_bank is None:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            question_bank = json.load(f)
        question_index = {}
        for subject, data in question_bank.items():
            for q in data.get("questions", []):
                question_index[q["id"]] = q
    return question_bank


def get_cached_path(key: str) -> Dict[str, Any] | None:
    entry = path_cache.get(key)
    if entry and (time.time() * 1000 - entry["ts"]) < PATH_CACHE_TTL:
        return entry["data"]
    if key in path_cache:
        del path_cache[key]
    return None


def set_cached_path(key: str, data: Dict[str, Any]):
    if len(path_cache) > 100:
        oldest = min(path_cache, key=lambda k: path_cache[k]["ts"])
        del path_cache[oldest]
    path_cache[key] = {"data": data, "ts": time.time() * 1000}


class Abilities(BaseModel):
    basicKnowledge: float
    problemSpeed: float
    reasoning: float
    memory: float
    comprehensive: float


class PathGenerateRequest(BaseModel):
    subject: str
    level: str
    abilities: Abilities


class PathAdjustRequest(BaseModel):
    subject: str
    abilities: Abilities
    currentUnits: List[Dict[str, Any]] = []


class QuizSubmitRequest(BaseModel):
    unitId: str
    answers: Dict[str, int]


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correctAnswer: int
    explanation: str


class LearningUnit(BaseModel):
    id: str
    title: str
    description: str
    difficulty: int
    order: int
    status: str
    quiz: List[QuizQuestion]
    score: float | None = None
    timeSpent: float | None = None
    isExpanded: bool = False
    estimatedTime: int | None = None


class QuestionDetail(BaseModel):
    questionId: str
    isCorrect: bool
    userAnswer: int
    correctAnswer: int
    explanation: str


class QuizResultResponse(BaseModel):
    score: float
    correctCount: int
    totalCount: int
    details: List[QuestionDetail]
    timeSpent: int


class PathResponse(BaseModel):
    units: List[LearningUnit]


LEVEL_DIFFICULTY_MAP = {
    "beginner": 1,
    "elementary": 2,
    "intermediate": 3,
    "advanced": 4,
}


def get_avg_ability(abilities: Abilities) -> float:
    values = [
        abilities.basicKnowledge,
        abilities.problemSpeed,
        abilities.reasoning,
        abilities.memory,
        abilities.comprehensive,
    ]
    return sum(values) / len(values)


def get_quiz_for_unit(subject: str, unit_id: str, count: int = 4) -> List[Dict[str, Any]]:
    bank = load_question_bank()
    if subject not in bank:
        return []
    
    subject_data = bank[subject]
    unit_questions = [q for q in subject_data["questions"] if q.get("unitId") == unit_id]
    
    if len(unit_questions) >= count:
        return random.sample(unit_questions, count)
    
    selected = list(unit_questions)
    remaining = count - len(selected)
    used_ids = {q["id"] for q in selected}
    
    others = [q for q in subject_data["questions"] if q["id"] not in used_ids]
    if others:
        fill = random.sample(others, min(remaining, len(others)))
        selected.extend(fill)
    
    return selected


def _make_cache_key(*parts: str) -> str:
    return "|".join(parts)


@app.get("/")
def read_root():
    return {"message": "自适应学习路径生成器 API", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/path/generate", response_model=PathResponse)
def generate_path(request: PathGenerateRequest):
    cache_key = _make_cache_key("gen", request.subject, request.level, str(request.abilities.model_dump()))
    cached = get_cached_path(cache_key)
    if cached:
        return cached

    bank = load_question_bank()
    subject = request.subject
    
    if subject not in bank:
        raise HTTPException(status_code=400, detail=f"不支持的学科: {subject}")
    
    subject_data = bank[subject]
    all_units = subject_data["units"]
    
    level_diff = LEVEL_DIFFICULTY_MAP.get(request.level, 2)
    avg_ability = get_avg_ability(request.abilities)
    
    target_difficulty = level_diff + (avg_ability - 5) * 0.3
    target_difficulty = max(1, min(5, target_difficulty))
    
    unit_count = random.randint(5, 8)
    
    sorted_units = sorted(all_units, key=lambda u: abs(u["difficulty"] - target_difficulty))
    selected_units = sorted_units[:unit_count]
    selected_units.sort(key=lambda u: u["difficulty"])
    
    result_units = []
    for i, unit in enumerate(selected_units):
        quiz_count = random.randint(3, 5)
        quiz_data = get_quiz_for_unit(subject, unit["id"], quiz_count)
        
        quiz_questions = [
            QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                correctAnswer=q["correctAnswer"],
                explanation=q["explanation"],
            )
            for q in quiz_data
        ]
        
        result_unit = LearningUnit(
            id=unit["id"],
            title=unit["title"],
            description=unit["description"],
            difficulty=unit["difficulty"],
            order=i + 1,
            status="pending",
            quiz=quiz_questions,
            estimatedTime=15 + random.randint(0, 15),
            isExpanded=False,
        )
        result_units.append(result_unit)
    
    result = {"units": result_units}
    set_cached_path(cache_key, result)
    return result


@app.post("/api/path/adjust", response_model=PathResponse)
def adjust_path(request: PathAdjustRequest):
    cache_key = _make_cache_key("adj", request.subject, str(request.abilities.model_dump()))
    cached = get_cached_path(cache_key)
    if cached:
        return cached

    bank = load_question_bank()
    subject = request.subject
    
    if subject not in bank:
        raise HTTPException(status_code=400, detail=f"不支持的学科: {subject}")
    
    if not request.currentUnits:
        return generate_path(
            PathGenerateRequest(
                subject=subject,
                level="elementary",
                abilities=request.abilities,
            )
        )
    
    avg_ability = get_avg_ability(request.abilities)
    ability_diff = avg_ability - 5
    
    adjusted_units = []
    pending_units = []
    completed_units = []
    
    for unit in request.currentUnits:
        if unit.get("status") in ["completed", "warning", "in-progress"]:
            completed_units.append(unit)
        else:
            pending_units.append(unit)
    
    for unit in pending_units:
        current_diff = unit.get("difficulty", 3)
        new_diff = current_diff + ability_diff * 0.4
        new_diff = max(1, min(5, round(new_diff)))
        unit["difficulty"] = new_diff
        adjusted_units.append(unit)
    
    adjusted_units.sort(key=lambda u: u["difficulty"])
    
    all_units = completed_units + adjusted_units
    
    result_units = []
    order = 1
    for unit in all_units:
        quiz_data = unit.get("quiz", [])
        if not quiz_data:
            quiz_data = get_quiz_for_unit(subject, unit.get("id", ""), 4)
        
        quiz_questions = [
            QuizQuestion(
                id=q.get("id", f"q-{i}"),
                question=q.get("question", ""),
                options=q.get("options", []),
                correctAnswer=q.get("correctAnswer", 0),
                explanation=q.get("explanation", ""),
            )
            for i, q in enumerate(quiz_data)
        ]
        
        result_unit = LearningUnit(
            id=unit.get("id", f"unit-{order}"),
            title=unit.get("title", ""),
            description=unit.get("description", ""),
            difficulty=unit.get("difficulty", 3),
            order=order,
            status=unit.get("status", "pending"),
            quiz=quiz_questions,
            score=unit.get("score"),
            timeSpent=unit.get("timeSpent"),
            estimatedTime=unit.get("estimatedTime", 20),
            isExpanded=unit.get("isExpanded", False),
        )
        result_units.append(result_unit)
        order += 1
    
    result = {"units": result_units}
    set_cached_path(cache_key, result)
    return result


@app.post("/api/quiz/submit", response_model=QuizResultResponse)
def submit_quiz(request: QuizSubmitRequest):
    bank = load_question_bank()
    
    details = []
    correct_count = 0
    total_count = len(request.answers)
    
    for question_id, user_answer in request.answers.items():
        q = question_index.get(question_id)
        if q:
            correct_answer = q["correctAnswer"]
            explanation = q["explanation"]
        else:
            correct_answer = 0
            explanation = "解析内容"
        
        is_correct = user_answer == correct_answer
        if is_correct:
            correct_count += 1
        
        detail = QuestionDetail(
            questionId=question_id,
            isCorrect=is_correct,
            userAnswer=user_answer,
            correctAnswer=correct_answer,
            explanation=explanation,
        )
        details.append(detail)
    
    score = round((correct_count / total_count) * 100) if total_count > 0 else 0
    time_spent = 10 + random.randint(0, 15)
    
    return QuizResultResponse(
        score=score,
        correctCount=correct_count,
        totalCount=total_count,
        details=details,
        timeSpent=time_spent,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8088)
