import csv
import io
import uuid as uuid_lib
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="Survey API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

surveys_db: dict = {}
responses_db: dict = {}


class QuestionIn(BaseModel):
    id: str
    type: str
    title: str
    required: bool = False
    options: Optional[list[str]] = None


class SurveyCreate(BaseModel):
    title: str
    description: str = ""
    questions: list[QuestionIn]


class AnswerIn(BaseModel):
    answers: dict


@app.post("/api/surveys")
def create_survey(payload: SurveyCreate):
    survey_id = str(uuid_lib.uuid4())[:8]
    survey = {
        "id": survey_id,
        "title": payload.title,
        "description": payload.description,
        "questions": [q.model_dump() for q in payload.questions],
        "response_count": 0,
        "created_at": datetime.now().isoformat(),
    }
    surveys_db[survey_id] = survey
    responses_db[survey_id] = []
    return survey


@app.get("/api/surveys/{survey_id}")
def get_survey(survey_id: str):
    if survey_id not in surveys_db:
        raise HTTPException(status_code=404, detail="Survey not found")
    return surveys_db[survey_id]


@app.post("/api/surveys/{survey_id}/responses")
def submit_response(survey_id: str, payload: AnswerIn):
    if survey_id not in surveys_db:
        raise HTTPException(status_code=404, detail="Survey not found")
    resp = {
        "id": str(uuid_lib.uuid4())[:8],
        "answers": payload.answers,
        "submitted_at": datetime.now().isoformat(),
    }
    responses_db[survey_id].append(resp)
    surveys_db[survey_id]["response_count"] = len(responses_db[survey_id])
    return {"status": "ok", "id": resp["id"]}


@app.get("/api/surveys/{survey_id}/results")
def get_results(
    survey_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    if survey_id not in surveys_db:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey = surveys_db[survey_id]
    resps = responses_db.get(survey_id, [])

    if start_date:
        resps = [r for r in resps if r["submitted_at"] >= start_date]
    if end_date:
        resps = [r for r in resps if r["submitted_at"] <= end_date + "T23:59:59"]

    stats = compute_statistics(survey, resps)
    return {
        "survey": survey,
        "responses": resps,
        "statistics": stats,
    }


@app.get("/api/surveys/{survey_id}/export")
def export_csv(
    survey_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    if survey_id not in surveys_db:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey = surveys_db[survey_id]
    resps = responses_db.get(survey_id, [])

    if start_date:
        resps = [r for r in resps if r["submitted_at"] >= start_date]
    if end_date:
        resps = [r for r in resps if r["submitted_at"] <= end_date + "T23:59:59"]

    output = io.StringIO()
    writer = csv.writer(output)
    headers = ["提交时间"] + [f"{q['title'] or '未命名'} ({q['type']})" for q in survey["questions"]]
    writer.writerow(headers)

    for resp in resps:
        row = [resp["submitted_at"]]
        for q in survey["questions"]:
            val = resp["answers"].get(q["id"], "")
            if isinstance(val, list):
                val = "; ".join(str(v) for v in val)
            row.append(str(val))
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=survey_{survey_id}.csv"},
    )


def compute_statistics(survey: dict, resps: list) -> dict:
    q_stats = []
    for q in survey["questions"]:
        stat: dict = {"question_id": q["id"], "type": q["type"]}
        if q["type"] in ("radio", "checkbox"):
            option_counts: dict = {opt: 0 for opt in (q.get("options") or [])}
            for resp in resps:
                ans = resp["answers"].get(q["id"])
                if ans is None:
                    continue
                if q["type"] == "radio":
                    option_counts[ans] = option_counts.get(ans, 0) + 1
                else:
                    for a in (ans if isinstance(ans, list) else [ans]):
                        option_counts[a] = option_counts.get(a, 0) + 1
            stat["option_counts"] = option_counts
        elif q["type"] == "rating":
            total = 0
            count = 0
            rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for resp in resps:
                ans = resp["answers"].get(q["id"])
                if ans is not None and isinstance(ans, (int, float)):
                    total += ans
                    count += 1
                    if ans in rating_counts:
                        rating_counts[int(ans)] += 1
            stat["avg_rating"] = round(total / count, 2) if count > 0 else 0
            stat["rating_counts"] = rating_counts
        elif q["type"] == "text":
            text_responses = []
            for resp in resps:
                ans = resp["answers"].get(q["id"])
                if ans and isinstance(ans, str):
                    text_responses.append(ans)
            stat["text_responses"] = text_responses
        q_stats.append(stat)
    return {"questions": q_stats}
