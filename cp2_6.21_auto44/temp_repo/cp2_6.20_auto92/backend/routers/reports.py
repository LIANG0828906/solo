from fastapi import APIRouter, HTTPException
from backend.models import (
    ReportData, AnalysisResult, ReportWithAnalysis, ReportSummary
)
from backend.analyzer import analyze_report
from backend.database import reports_db, reports_by_employee

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/reports", response_model=AnalysisResult)
def create_report(report_data: ReportData):
    result = analyze_report(report_data)
    reports_db[result.report_id] = {
        "report_data": report_data,
        "analysis": result
    }
    if report_data.employee_id not in reports_by_employee:
        reports_by_employee[report_data.employee_id] = []
    reports_by_employee[report_data.employee_id].append(result.report_id)
    return result


@router.get("/reports/{report_id}", response_model=ReportWithAnalysis)
def get_report(report_id: str):
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="报告不存在")
    entry = reports_db[report_id]
    rd = entry["report_data"]
    an = entry["analysis"]
    return ReportWithAnalysis(
        employee_id=rd.employee_id,
        employee_name=rd.employee_name,
        department=rd.department,
        basic_info=rd.basic_info,
        blood_metrics=rd.blood_metrics,
        lifestyle=rd.lifestyle,
        report_id=an.report_id,
        overall_score=an.overall_score,
        risk_scores=an.risk_scores,
        trends=an.trends,
        suggestions=an.suggestions,
        report_date=an.report_date
    )


@router.get("/employees/{employee_id}/reports", response_model=list[ReportSummary])
def get_employee_reports(employee_id: str):
    if employee_id not in reports_by_employee:
        raise HTTPException(status_code=404, detail="员工不存在")
    report_ids = reports_by_employee[employee_id]
    summaries = []
    for rid in report_ids:
        entry = reports_db[rid]
        an = entry["analysis"]
        abnormalities = [
            s.metric for s in an.suggestions
            if s.status in ("warning", "danger") and s.metric != "综合评估"
        ]
        summaries.append(ReportSummary(
            id=an.report_id,
            date=an.report_date,
            overall_score=an.overall_score,
            key_abnormalities=abnormalities
        ))
    summaries.sort(key=lambda x: x.date, reverse=True)
    return summaries
