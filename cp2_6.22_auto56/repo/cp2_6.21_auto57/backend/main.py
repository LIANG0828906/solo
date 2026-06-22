from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List
from models import RecordCreate, RecordResponse, DaySummary, TrendData, AnalysisResponse, TagAnalysis
from database import init_db, create_record, get_records_by_date, get_records_range, get_calendar_data, get_trends, get_analysis
import io
import csv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.post("/api/record")
def api_create_record(record: RecordCreate):
    tags_str = ",".join(record.tags)
    record_id = create_record(
        timestamp=record.timestamp,
        category=record.category,
        intensity=record.intensity,
        energy=record.energy,
        note=record.note or "",
        tags=tags_str
    )
    return {"id": record_id, "message": "记录成功"}


@app.get("/api/records")
def api_get_records(date: str = Query(None, description="日期，格式 YYYY-MM-DD"),
                    start_date: str = Query(None, description="开始日期"),
                    end_date: str = Query(None, description="结束日期")):
    if start_date and end_date:
        return get_records_range(start_date, end_date)
    if date:
        return get_records_by_date(date)
    return []


@app.get("/api/calendar")
def api_get_calendar(month: str = Query(..., description="月份，格式 YYYY-MM")):
    data = get_calendar_data(month)
    return data


@app.get("/api/trends")
def api_get_trends(days: int = Query(7, description="天数 7/14/30")):
    data = get_trends(days)
    return data


@app.get("/api/analysis")
def api_get_analysis():
    data = get_analysis()
    return data


@app.get("/api/export")
def api_export(start_date: str = Query(...), end_date: str = Query(...)):
    records = get_records_range(start_date, end_date)
    output = io.StringIO()
    output.write('\uFEFF')
    writer = csv.writer(output)
    writer.writerow(["日期", "时间", "情绪类别", "情绪强度", "精力值", "生活事件标签", "文字备注"])
    for r in records:
        ts = r["timestamp"]
        if "T" in ts:
            date_part, time_part = ts.split("T")
        else:
            date_part = ts[:10]
            time_part = ts[11:16] if len(ts) > 16 else ""
        writer.writerow([
            date_part,
            time_part[:5],
            r["category"],
            r["intensity"],
            r["energy"],
            r["tags"],
            r["note"]
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=emotion_data_{start_date}_{end_date}.csv"}
    )
