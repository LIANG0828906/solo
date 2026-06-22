from typing import List, Dict
from backend.repositories import json_repository
from backend.services import essay_service


SCORES_FILE = "scores.json"


def get_overview(class_id: str) -> Dict:
    essays = essay_service.get_essays_by_class(class_id)
    essay_ids = [e["id"] for e in essays]
    all_scores = json_repository.get_all(SCORES_FILE)
    class_scores = [s for s in all_scores if s.get("essayId") in essay_ids]
    total = len(class_scores)
    if total == 0:
        return {"total": 0, "average": 0}
    sum_total = sum(
        s.get("content", 0) + s.get("language", 0) + s.get("structure", 0) + s.get("creativity", 0)
        for s in class_scores
    )
    average = (sum_total / (total * 40)) * 100
    return {"total": total, "average": round(average, 1)}


def get_dimension_stats(class_id: str) -> List[Dict]:
    essays = essay_service.get_essays_by_class(class_id)
    essay_ids = [e["id"] for e in essays]
    all_scores = json_repository.get_all(SCORES_FILE)
    class_scores = [s for s in all_scores if s.get("essayId") in essay_ids]
    if not class_scores:
        return [
            {"dimension": "内容", "average": 0, "color": "#1976d2"},
            {"dimension": "语言", "average": 0, "color": "#4caf50"},
            {"dimension": "结构", "average": 0, "color": "#ff9800"},
            {"dimension": "创意", "average": 0, "color": "#9c27b0"},
        ]
    n = len(class_scores)
    return [
        {"dimension": "内容", "average": round(sum(s.get("content", 0) for s in class_scores) / n, 1), "color": "#1976d2"},
        {"dimension": "语言", "average": round(sum(s.get("language", 0) for s in class_scores) / n, 1), "color": "#4caf50"},
        {"dimension": "结构", "average": round(sum(s.get("structure", 0) for s in class_scores) / n, 1), "color": "#ff9800"},
        {"dimension": "创意", "average": round(sum(s.get("creativity", 0) for s in class_scores) / n, 1), "color": "#9c27b0"},
    ]


def get_distribution(class_id: str) -> List[Dict]:
    essays = essay_service.get_essays_by_class(class_id)
    essay_ids = [e["id"] for e in essays]
    all_scores = json_repository.get_all(SCORES_FILE)
    class_scores = [s for s in all_scores if s.get("essayId") in essay_ids]
    excellent = good = medium = poor = 0
    for s in class_scores:
        total = s.get("content", 0) + s.get("language", 0) + s.get("structure", 0) + s.get("creativity", 0)
        score_pct = (total / 40) * 100
        if score_pct > 90:
            excellent += 1
        elif score_pct >= 80:
            good += 1
        elif score_pct >= 70:
            medium += 1
        else:
            poor += 1
    return [
        {"grade": "优秀(>90)", "count": excellent, "color": "#4caf50"},
        {"grade": "良好(80-90)", "count": good, "color": "#1976d2"},
        {"grade": "中等(70-80)", "count": medium, "color": "#ff9800"},
        {"grade": "待提升(<70)", "count": poor, "color": "#f44336"},
    ]


def get_student_radar(essay_id: str) -> List[Dict]:
    all_scores = json_repository.get_all(SCORES_FILE)
    student_score = next((s for s in all_scores if s.get("essayId") == essay_id), None)
    essay = essay_service.get_essay_by_id(essay_id)
    class_id = essay.get("classId") if essay else None
    class_avg = get_dimension_stats(class_id) if class_id else []
    avg_map = {d["dimension"]: d["average"] for d in class_avg}
    if not student_score:
        return [
            {"dimension": "内容", "student": 0, "classAverage": avg_map.get("内容", 0)},
            {"dimension": "语言", "student": 0, "classAverage": avg_map.get("语言", 0)},
            {"dimension": "结构", "student": 0, "classAverage": avg_map.get("结构", 0)},
            {"dimension": "创意", "student": 0, "classAverage": avg_map.get("创意", 0)},
        ]
    return [
        {"dimension": "内容", "student": student_score.get("content", 0), "classAverage": avg_map.get("内容", 7)},
        {"dimension": "语言", "student": student_score.get("language", 0), "classAverage": avg_map.get("语言", 7)},
        {"dimension": "结构", "student": student_score.get("structure", 0), "classAverage": avg_map.get("结构", 7)},
        {"dimension": "创意", "student": student_score.get("creativity", 0), "classAverage": avg_map.get("创意", 7)},
    ]


def submit_score(data) -> dict:
    from datetime import datetime as _dt
    import uuid as _uuid
    all_scores = json_repository.get_all(SCORES_FILE)
    existing = next((s for s in all_scores if s.get("essayId") == data.essayId), None)
    if existing:
        updates = {
            "content": data.content,
            "language": data.language,
            "structure": data.structure,
            "creativity": data.creativity,
            "gradedAt": _dt.utcnow().isoformat(),
        }
        return json_repository.update(SCORES_FILE, existing["id"], updates) or existing
    new_score = {
        "id": f"score-{_uuid.uuid4().hex[:8]}",
        "essayId": data.essayId,
        "content": data.content,
        "language": data.language,
        "structure": data.structure,
        "creativity": data.creativity,
        "gradedAt": _dt.utcnow().isoformat(),
    }
    return json_repository.create(SCORES_FILE, new_score)


def get_score_by_essay(essay_id: str):
    all_scores = json_repository.get_all(SCORES_FILE)
    return next((s for s in all_scores if s.get("essayId") == essay_id), None)
