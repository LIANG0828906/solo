from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import uuid
import time
import hashlib

app = FastAPI(title="在线答题系统 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    id: str
    type: str
    content: str
    options: Optional[List[str]] = None
    answer: str
    score: int


class Quiz(BaseModel):
    id: str
    title: str
    questions: List[Question]
    createdAt: str


class Answer(BaseModel):
    questionId: str
    answer: str
    isCorrect: bool
    timeSpent: int


class QuestionStat(BaseModel):
    questionId: str
    questionIndex: int
    accuracy: float
    avgTimeSpent: float


class Score(BaseModel):
    quizId: str
    studentName: str
    totalScore: int
    correctCount: int
    totalQuestions: int
    accuracy: float
    totalTime: int
    answers: List[Answer]
    questionStats: List[QuestionStat]
    submittedAt: str


class SubmitRequest(BaseModel):
    quizId: str
    studentName: str
    answers: List[Answer]


class QuestionCreate(BaseModel):
    type: str
    content: str
    options: Optional[List[str]] = None
    answer: str
    score: int = 10


class QuizCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, description="测验标题")
    questions: List[QuestionCreate] = Field(..., min_length=10, description="至少10道题")


class QuestionAnswerRecord(BaseModel):
    questionId: str
    startTime: float
    endTime: float
    timeSpent: int
    answer: str
    isCorrect: bool


class QuizAnswerRecord(BaseModel):
    quizId: str
    studentName: str
    submittedAt: str
    questionRecords: List[QuestionAnswerRecord]


last_modified = time.time()
answer_records_db: List[QuizAnswerRecord] = []
question_time_aggregates: Dict[str, List[int]] = {}


def update_last_modified():
    global last_modified
    last_modified = time.time()


quizzes_db: List[Quiz] = [
    Quiz(
        id="quiz-1",
        title="JavaScript 基础测验",
        createdAt="2026-06-15T10:00:00Z",
        questions=[
            Question(id="q1", type="choice", content="以下哪个不是 JavaScript 的基本数据类型？", options=["String", "Number", "Array", "Boolean"], answer="Array", score=10),
            Question(id="q2", type="judge", content="JavaScript 是一种强类型语言。", answer="false", score=10),
            Question(id="q3", type="fill", content="在 JavaScript 中，用于声明常量的关键字是______。", answer="const", score=10),
            Question(id="q4", type="choice", content="以下哪个方法用于向数组末尾添加元素？", options=["push()", "pop()", "shift()", "unshift()"], answer="push()", score=10),
            Question(id="q5", type="judge", content="null 和 undefined 在 JavaScript 中是相同的值。", answer="false", score=10),
            Question(id="q6", type="fill", content="用于将 JSON 字符串转换为 JavaScript 对象的方法是 JSON.______()。", answer="parse", score=10),
            Question(id="q7", type="choice", content="以下哪个运算符用于严格相等比较？", options=["==", "===", "=", "!="], answer="===", score=10),
            Question(id="q8", type="judge", content="let 声明的变量具有块级作用域。", answer="true", score=10),
            Question(id="q9", type="fill", content="箭头函数使用的符号是______。", answer="=>", score=10),
            Question(id="q10", type="choice", content="以下哪个不是循环语句？", options=["for", "while", "forEach", "if"], answer="if", score=10),
        ],
    ),
    Quiz(
        id="quiz-2",
        title="React 核心概念测验",
        createdAt="2026-06-18T14:30:00Z",
        questions=[
            Question(id="r1", type="choice", content="React 中用于管理组件状态的 Hook 是？", options=["useEffect", "useState", "useContext", "useRef"], answer="useState", score=10),
            Question(id="r2", type="judge", content="React 组件的状态可以直接修改。", answer="false", score=10),
            Question(id="r3", type="fill", content="React 中用于处理副作用的 Hook 是 use______。", answer="Effect", score=10),
            Question(id="r4", type="choice", content="以下哪个不是 React 的生命周期阶段？", options=["Mounting", "Updating", "Unmounting", "Rendering"], answer="Rendering", score=10),
            Question(id="r5", type="judge", content="JSX 可以直接在浏览器中运行。", answer="false", score=10),
            Question(id="r6", type="fill", content="React 组件接收的只读数据参数称为______。", answer="props", score=10),
            Question(id="r7", type="choice", content="在 React 中，key 属性的主要作用是？", options=["设置样式", "帮助 React 识别列表中元素的变化", "传递数据", "触发事件"], answer="帮助 React 识别列表中元素的变化", score=10),
            Question(id="r8", type="judge", content="React 采用虚拟 DOM 来提高性能。", answer="true", score=10),
            Question(id="r9", type="fill", content="用于在函数组件中访问 DOM 元素的 Hook 是 use______。", answer="Ref", score=10),
            Question(id="r10", type="choice", content="以下哪个是 React Router 中用于导航的组件？", options=["<Route>", "<Link>", "<Switch>", "<BrowserRouter>"], answer="<Link>", score=10),
        ],
    ),
]

scores_db: List[Score] = [
    Score(
        quizId="quiz-1",
        studentName="张三",
        totalScore=80,
        correctCount=8,
        totalQuestions=10,
        accuracy=80,
        totalTime=185,
        answers=[],
        questionStats=[QuestionStat(questionId=f"q{i+1}", questionIndex=i, accuracy=75 + i * 2, avgTimeSpent=15 + i * 1.5) for i in range(10)],
        submittedAt="2026-06-19T09:30:00Z",
    ),
    Score(
        quizId="quiz-1",
        studentName="李四",
        totalScore=90,
        correctCount=9,
        totalQuestions=10,
        accuracy=90,
        totalTime=150,
        answers=[],
        questionStats=[QuestionStat(questionId=f"q{i+1}", questionIndex=i, accuracy=80 + i * 1.5, avgTimeSpent=12 + i) for i in range(10)],
        submittedAt="2026-06-19T10:15:00Z",
    ),
    Score(
        quizId="quiz-2",
        studentName="王五",
        totalScore=70,
        correctCount=7,
        totalQuestions=10,
        accuracy=70,
        totalTime=220,
        answers=[],
        questionStats=[QuestionStat(questionId=f"r{i+1}", questionIndex=i, accuracy=60 + i * 2.5, avgTimeSpent=18 + i * 2) for i in range(10)],
        submittedAt="2026-06-19T11:00:00Z",
    ),
]


@app.get("/api/quizzes")
async def get_quizzes(request: Request, response: Response):
    if_modified_since = request.headers.get("if-modified-since")
    if if_modified_since:
        try:
            client_time = float(if_modified_since)
            if client_time >= last_modified:
                response.status_code = 304
                return []
        except (ValueError, TypeError):
            pass

    response.headers["Last-Modified"] = str(last_modified)
    response.headers["Cache-Control"] = "no-cache"
    return quizzes_db


@app.get("/api/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str):
    for quiz in quizzes_db:
        if quiz.id == quiz_id:
            return quiz
    raise HTTPException(status_code=404, detail="Quiz not found")


@app.post("/api/quizzes")
async def create_quiz(request: QuizCreateRequest):
    for q in request.questions:
        if q.type not in ["choice", "judge", "fill"]:
            raise HTTPException(status_code=400, detail=f"无效的题目类型: {q.type}")
        if q.type == "choice":
            if not q.options or len(q.options) < 4:
                raise HTTPException(status_code=400, detail="选择题至少需要4个选项")
        if not q.content.strip():
            raise HTTPException(status_code=400, detail="题目内容不能为空")
        if not q.answer.strip():
            raise HTTPException(status_code=400, detail="答案不能为空")

    questions = [
        Question(
            id=str(uuid.uuid4()),
            type=q.type,
            content=q.content,
            options=q.options,
            answer=q.answer,
            score=q.score,
        )
        for q in request.questions
    ]

    quiz = Quiz(
        id=str(uuid.uuid4()),
        title=request.title,
        questions=questions,
        createdAt=datetime.utcnow().isoformat() + "Z",
    )

    quizzes_db.append(quiz)
    update_last_modified()
    return quiz


@app.post("/api/quizzes/submit")
async def submit_quiz(request: SubmitRequest):
    quiz = next((q for q in quizzes_db if q.id == request.quizId), None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    total_score = 0
    correct_count = 0
    total_time = 0
    processed_answers: List[Answer] = []
    question_records: List[QuestionAnswerRecord] = []

    for ua in request.answers:
        question = next((q for q in quiz.questions if q.id == ua.questionId), None)
        is_correct = question and question.answer.lower().strip() == ua.answer.lower().strip()
        if is_correct:
            correct_count += 1
            total_score += question.score if question else 0
        total_time += ua.timeSpent
        processed_answers.append(
            Answer(
                questionId=ua.questionId,
                answer=ua.answer,
                isCorrect=bool(is_correct),
                timeSpent=ua.timeSpent,
            )
        )

        if ua.questionId not in question_time_aggregates:
            question_time_aggregates[ua.questionId] = []
        question_time_aggregates[ua.questionId].append(ua.timeSpent)

        end_time = time.time()
        start_time = end_time - ua.timeSpent
        question_records.append(
            QuestionAnswerRecord(
                questionId=ua.questionId,
                startTime=start_time,
                endTime=end_time,
                timeSpent=ua.timeSpent,
                answer=ua.answer,
                isCorrect=bool(is_correct),
            )
        )

    answer_record = QuizAnswerRecord(
        quizId=request.quizId,
        studentName=request.studentName,
        submittedAt=datetime.utcnow().isoformat() + "Z",
        questionRecords=question_records,
    )
    answer_records_db.append(answer_record)

    question_stats: List[QuestionStat] = []
    for idx, q in enumerate(quiz.questions):
        answer = next((a for a in processed_answers if a.questionId == q.id), None)
        correct_answers = [
            ar for ar in answer_records_db
            if any(qr.questionId == q.id and qr.isCorrect for qr in ar.questionRecords)
        ]
        total_answers = [
            ar for ar in answer_records_db
            if any(qr.questionId == q.id for qr in ar.questionRecords)
        ]

        times = question_time_aggregates.get(q.id, [answer.timeSpent if answer else 0])
        avg_time = sum(times) / len(times) if times else 0
        accuracy = (len(correct_answers) / len(total_answers) * 100) if total_answers else (100 if (answer and answer.isCorrect) else 0)

        question_stats.append(
            QuestionStat(
                questionId=q.id,
                questionIndex=idx,
                accuracy=round(accuracy, 1),
                avgTimeSpent=round(avg_time, 1),
            )
        )

    score = Score(
        quizId=request.quizId,
        studentName=request.studentName,
        totalScore=total_score,
        correctCount=correct_count,
        totalQuestions=len(quiz.questions),
        accuracy=round((correct_count / len(quiz.questions)) * 100),
        totalTime=total_time,
        answers=processed_answers,
        questionStats=question_stats,
        submittedAt=datetime.utcnow().isoformat() + "Z",
    )

    scores_db.append(score)
    update_last_modified()
    return score


@app.get("/api/scores")
async def get_scores(request: Request, response: Response, quizId: Optional[str] = None, since: Optional[float] = None):
    if_modified_since = request.headers.get("if-modified-since")
    check_time = since or (float(if_modified_since) if if_modified_since else None)

    if check_time and check_time >= last_modified:
        response.status_code = 304
        return []

    all_scores = [s for s in scores_db if s.quizId == quizId] if quizId else scores_db

    if since:
        cutoff = datetime.fromtimestamp(since)
        all_scores = [
            s for s in all_scores
            if datetime.fromisoformat(s.submittedAt.replace("Z", "+00:00")).replace(tzinfo=None) > cutoff
        ]

    response.headers["Last-Modified"] = str(last_modified)
    response.headers["X-Total-Count"] = str(len(all_scores))
    return all_scores


@app.get("/api/scores/{score_id}")
async def get_score_detail(score_id: str):
    for score in scores_db:
        if score.quizId == score_id or score.studentName == score_id:
            return score
    if scores_db:
        return scores_db[0]
    raise HTTPException(status_code=404, detail="Score not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
