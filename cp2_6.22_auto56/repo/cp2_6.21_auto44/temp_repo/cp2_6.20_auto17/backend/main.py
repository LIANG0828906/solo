from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
import random

app = FastAPI(title="智能作业批改 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    id: int
    content: str
    standardAnswer: str
    keywords: List[str]
    maxWords: int

class Answer(BaseModel):
    questionId: int
    content: str

class GradingResult(BaseModel):
    questionId: int
    score: int
    feedback: str
    errorType: Optional[str] = None

class GradeRequest(BaseModel):
    questions: List[Question]
    answers: List[Answer]

def calculate_keyword_match(student_answer: str, keywords: List[str]) -> float:
    answer_lower = student_answer.lower()
    matched = sum(1 for keyword in keywords if keyword.lower() in answer_lower)
    return matched / len(keywords) if keywords else 0

def calculate_length_score(student_answer: str, max_words: int) -> float:
    word_count = len(student_answer.strip().split())
    if word_count == 0:
        return 0
    ratio = word_count / max_words
    if ratio >= 0.8:
        return 1
    elif ratio >= 0.5:
        return 0.7
    elif ratio >= 0.2:
        return 0.4
    return 0.2

def calculate_semantic_similarity(student_answer: str, standard_answer: str) -> float:
    student_words = set(student_answer.lower().split())
    standard_words = set(standard_answer.lower().split())
    if not standard_words:
        return 0
    intersection = len(student_words & standard_words)
    return intersection / len(standard_words)

def determine_error_type(keyword_match: float, length_score: float, semantic_similarity: float) -> Optional[str]:
    if keyword_match < 0.4 and semantic_similarity < 0.3:
        return "knowledge_gap"
    if length_score < 0.5 and keyword_match >= 0.5:
        return "unclear_expression"
    if keyword_match >= 0.3 and semantic_similarity < 0.4:
        return "misunderstanding"
    return None

def generate_feedback(score: int, error_type: Optional[str]) -> str:
    if score >= 90:
        return "回答完整，逻辑清晰，非常优秀！"
    if score >= 80:
        return "回答较完整，关键点都有覆盖。"
    if score >= 70:
        return "回答基本正确，但部分表述不够准确。"
    if score >= 60:
        if error_type == "knowledge_gap":
            return "缺少部分关键知识点，建议复习相关内容。"
        elif error_type == "unclear_expression":
            return "思路正确但表述不够清晰，建议组织语言。"
        elif error_type == "misunderstanding":
            return "对题目理解有偏差，建议仔细审题。"
        return "回答基本及格，仍有提升空间。"
    if error_type == "knowledge_gap":
        return "缺少关键点，需要加强基础知识学习。"
    elif error_type == "unclear_expression":
        return "表述不清，建议多练习书面表达。"
    elif error_type == "misunderstanding":
        return "理解偏差较大，需重新审题后作答。"
    return "得分较低，需要认真复习相关知识。"

@app.post("/api/grade", response_model=List[GradingResult])
async def grade_assignment(request: GradeRequest):
    time.sleep(2)
    
    results = []
    for question in request.questions:
        answer = next((a for a in request.answers if a.questionId == question.id), None)
        student_answer = answer.content if answer else ""
        
        keyword_match = calculate_keyword_match(student_answer, question.keywords)
        length_score = calculate_length_score(student_answer, question.maxWords)
        semantic_similarity = calculate_semantic_similarity(student_answer, question.standardAnswer)
        
        score = round(keyword_match * 50 + length_score * 20 + semantic_similarity * 30)
        score = min(100, max(0, score))
        
        error_type = determine_error_type(keyword_match, length_score, semantic_similarity) if score < 60 else None
        feedback = generate_feedback(score, error_type)
        
        results.append(GradingResult(
            questionId=question.id,
            score=score,
            feedback=feedback,
            errorType=error_type
        ))
    
    return results

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "评分引擎运行正常"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
