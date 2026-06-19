from services.interview_service import InterviewSession, TIME_LIMITS, CATEGORIES


def _category_score(questions: list) -> float:
    scored = [q for q in questions if q.score is not None]
    if not scored:
        return 50.0
    avg = sum(q.score for q in scored) / len(scored)
    return round(avg / 5 * 100, 1)


def _speed_score(completed: list, difficulty: str) -> float:
    time_limit = TIME_LIMITS.get(difficulty, 120)
    timed = [q for q in completed if q.timeSpent is not None]
    if not timed:
        return 50.0
    ratios = [q.timeSpent / time_limit for q in timed]
    avg_ratio = sum(ratios) / len(ratios)
    score = max(0, min(100, (1 - avg_ratio) * 100 + 20))
    return round(score, 1)


def _breadth_score(completed: list) -> float:
    if not completed:
        return 0.0
    categories = set(q.category for q in completed)
    good_per_category = {}
    for q in completed:
        if q.score is not None and q.score >= 3:
            good_per_category.setdefault(q.category, 0)
            good_per_category[q.category] += 1
    coverage = len(good_per_category) / max(len(categories), 1)
    quality = sum(good_per_category.values()) / len(completed)
    return round((coverage * 0.5 + quality * 0.5) * 100, 1)


def _confidence_score(completed: list) -> float:
    if not completed:
        return 0.0
    avg_length = sum(len(q.answer or "") for q in completed) / len(completed)
    length_score = min(100, avg_length / 2)

    scores = [q.score for q in completed if q.score is not None]
    if len(scores) > 1:
        mean = sum(scores) / len(scores)
        variance = sum((s - mean) ** 2 for s in scores) / len(scores)
        consistency_score = max(0, 100 - variance * 10)
    else:
        consistency_score = 50.0

    return round(length_score * 0.4 + consistency_score * 0.6, 1)


DIMENSION_NAMES = {
    "technical_depth": "技术深度",
    "communication": "沟通表达",
    "logical_thinking": "逻辑思维",
}


def calculate_analysis(session: InterviewSession) -> dict:
    completed = [q for q in session.questions if q.answer is not None]

    if not completed:
        return {
            "sessionId": session.id,
            "dimensions": {},
            "overallScore": 0,
            "timeSeries": [],
            "totalQuestions": len(session.questions),
            "completedQuestions": 0,
            "error": "暂无已回答的问题",
        }

    dimensions = {}
    for cat_key, cat_name in DIMENSION_NAMES.items():
        cat_questions = [q for q in completed if q.category == cat_key]
        dimensions[cat_name] = _category_score(cat_questions) if cat_questions else round(_category_score(completed) * 0.6, 1)

    dimensions["反应速度"] = _speed_score(completed, session.difficulty)
    dimensions["知识广度"] = _breadth_score(completed)
    dimensions["自信度"] = _confidence_score(completed)

    overall = round(sum(dimensions.values()) / len(dimensions), 1)

    time_series = []
    for i, q in enumerate(completed):
        time_series.append({
            "questionIndex": i,
            "question": q.question,
            "category": q.category,
            "score": q.score,
            "timeSpent": q.timeSpent,
            "keywordMatch": q.feedback.keywordMatch if q.feedback else 0,
        })

    score_distribution = {}
    for q in completed:
        if q.score is not None:
            score_distribution.setdefault(q.score, 0)
            score_distribution[q.score] += 1

    avg_time = sum(q.timeSpent or 0 for q in completed) / len(completed)

    strengths = [k for k, v in dimensions.items() if v >= 70]
    weaknesses = [k for k, v in dimensions.items() if v < 50]

    return {
        "sessionId": session.id,
        "resumeId": session.resumeId,
        "difficulty": session.difficulty,
        "dimensions": dimensions,
        "overallScore": overall,
        "timeSeries": time_series,
        "totalQuestions": len(session.questions),
        "completedQuestions": len(completed),
        "scoreDistribution": score_distribution,
        "averageResponseTime": round(avg_time, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
    }
