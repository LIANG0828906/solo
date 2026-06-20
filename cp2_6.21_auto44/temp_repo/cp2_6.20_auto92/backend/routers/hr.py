from fastapi import APIRouter
from backend.models import HROverviewData
from backend.database import reports_db, employee_info

router = APIRouter(prefix="/api/hr", tags=["hr"])


@router.get("/overview", response_model=HROverviewData)
def get_hr_overview():
    total_employees = len(employee_info)
    all_scores = []
    high_risk_count = 0
    metric_counts = {}
    high_risk_list = []

    latest_reports = {}
    for rid, entry in reports_db.items():
        eid = entry["report_data"].employee_id
        if eid not in latest_reports or entry["analysis"].report_date > latest_reports[eid]["analysis"].report_date:
            latest_reports[eid] = entry

    for eid, entry in latest_reports.items():
        rd = entry["report_data"]
        an = entry["analysis"]
        all_scores.append(an.overall_score)

        if an.overall_score < 60:
            high_risk_count += 1
            abnormalities = [
                s.metric for s in an.suggestions
                if s.status in ("warning", "danger") and s.metric != "综合评估"
            ]
            high_risk_list.append({
                "name": rd.employee_name,
                "department": rd.department,
                "score": an.overall_score,
                "abnormalities": abnormalities
            })

        for s in an.suggestions:
            if s.status in ("warning", "danger") and s.metric != "综合评估":
                metric_counts[s.metric] = metric_counts.get(s.metric, 0) + 1

    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0

    metric_distribution = [
        {"metric": k, "count": v}
        for k, v in sorted(metric_counts.items(), key=lambda x: -x[1])
    ]

    high_risk_list.sort(key=lambda x: x["score"])

    return HROverviewData(
        total_employees=total_employees,
        avg_score=avg_score,
        high_risk_count=high_risk_count,
        metric_distribution=metric_distribution,
        high_risk_employees=high_risk_list
    )
