import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from backend.models import (
    ReportData, AnalysisResult, RiskScores, Suggestion, TrendPoint
)


def calculate_bmi(height: float, weight: float) -> float:
    return round(weight / ((height / 100) ** 2), 1)


def get_status(value: float, normal_max: float, warn_max: float) -> str:
    if value <= normal_max:
        return "normal"
    elif value <= warn_max:
        return "warning"
    else:
        return "danger"


def get_status_low(value: float, normal_min: float, warn_min: float) -> str:
    if value >= normal_min:
        return "normal"
    elif value >= warn_min:
        return "warning"
    else:
        return "danger"


def analyze_report(report_data: ReportData) -> AnalysisResult:
    report_id = f"RPT{uuid.uuid4().hex[:8].upper()}"
    report_date = datetime.now().strftime("%Y-%m-%d")

    bi = report_data.basic_info
    bm = report_data.blood_metrics
    ls = report_data.lifestyle
    bmi = calculate_bmi(bi.height, bi.weight)

    cardio_score = calc_cardiovascular_score(bm)
    metabolic_score = calc_metabolic_score(bm, bmi)
    respiratory_score = calc_respiratory_score(ls)
    digestive_score = calc_digestive_score(ls, bmi)
    skeletal_score = calc_skeletal_score(ls, bi.age, bi.gender)

    overall_score = round((
        cardio_score * 0.3 +
        metabolic_score * 0.3 +
        respiratory_score * 0.1 +
        digestive_score * 0.15 +
        skeletal_score * 0.15
    ))
    overall_score = max(0, min(100, overall_score))

    suggestions = generate_suggestions(bi, bm, ls, bmi)
    trends = generate_trends(bi, bm, bmi)

    return AnalysisResult(
        report_id=report_id,
        overall_score=overall_score,
        risk_scores=RiskScores(
            cardiovascular=cardio_score,
            metabolic=metabolic_score,
            respiratory=respiratory_score,
            digestive=digestive_score,
            skeletal=skeletal_score
        ),
        trends=trends,
        suggestions=suggestions,
        report_date=report_date
    )


def calc_cardiovascular_score(bm) -> int:
    score = 100

    if bm.systolic_bp > 140 or bm.diastolic_bp > 90:
        score -= 25
    elif bm.systolic_bp > 130 or bm.diastolic_bp > 85:
        score -= 12

    if bm.total_cholesterol > 6.2:
        score -= 20
    elif bm.total_cholesterol > 5.2:
        score -= 10

    if bm.ldl > 4.1:
        score -= 18
    elif bm.ldl > 3.4:
        score -= 9

    if bm.hdl < 1.0:
        score -= 15
    elif bm.hdl < 1.2:
        score -= 8

    if bm.triglycerides > 2.3:
        score -= 15
    elif bm.triglycerides > 1.7:
        score -= 7

    return max(0, score)


def calc_metabolic_score(bm, bmi: float) -> int:
    score = 100

    if bm.fasting_glucose > 7.0:
        score -= 25
    elif bm.fasting_glucose > 6.1:
        score -= 12

    if bmi > 28:
        score -= 20
    elif bmi > 24:
        score -= 10

    if bm.triglycerides > 2.3:
        score -= 15
    elif bm.triglycerides > 1.7:
        score -= 7

    if bm.total_cholesterol > 6.2:
        score -= 12
    elif bm.total_cholesterol > 5.2:
        score -= 6

    return max(0, score)


def calc_respiratory_score(ls) -> int:
    score = 100

    if ls.smoking:
        score -= 30

    if ls.exercise_freq < 1:
        score -= 20
    elif ls.exercise_freq < 3:
        score -= 10

    if ls.sleep_hours < 6:
        score -= 15
    elif ls.sleep_hours < 7:
        score -= 7

    return max(0, score)


def calc_digestive_score(ls, bmi: float) -> int:
    score = 100

    if ls.drinking:
        score -= 20

    if bmi > 28:
        score -= 18
    elif bmi > 24:
        score -= 9

    if ls.exercise_freq < 1:
        score -= 12
    elif ls.exercise_freq < 3:
        score -= 6

    return max(0, score)


def calc_skeletal_score(ls, age: int, gender: str) -> int:
    score = 100

    if age > 60:
        score -= 20
    elif age > 50:
        score -= 12
    elif age > 40:
        score -= 6

    if ls.exercise_freq < 1:
        score -= 25
    elif ls.exercise_freq < 3:
        score -= 12

    if gender == "女" and age > 50:
        score -= 10
    elif gender == "女" and age > 45:
        score -= 5

    return max(0, score)


def generate_suggestions(bi, bm, ls, bmi: float) -> List[Suggestion]:
    suggestions: List[Suggestion] = []
    sug_id = 0

    def add_sug(metric: str, current_value: str, status: str, advice: str, source: str):
        nonlocal sug_id
        sug_id += 1
        suggestions.append(Suggestion(
            id=f"SUG{str(sug_id).zfill(3)}",
            metric=metric,
            current_value=current_value,
            status=status,
            advice=advice,
            source=source
        ))

    fg_status = get_status(bm.fasting_glucose, 6.1, 7.0)
    if fg_status != "normal":
        add_sug(
            "空腹血糖",
            f"{bm.fasting_glucose} mmol/L",
            fg_status,
            "建议减少精制碳水化合物摄入，增加膳食纤维",
            "中国2型糖尿病防治指南"
        )
        if fg_status == "danger":
            add_sug(
                "空腹血糖",
                f"{bm.fasting_glucose} mmol/L",
                fg_status,
                "建议尽早就医复查，必要时进行OGTT试验",
                "中国2型糖尿病防治指南"
            )

    tc_status = get_status(bm.total_cholesterol, 5.2, 6.2)
    if tc_status != "normal":
        add_sug(
            "总胆固醇",
            f"{bm.total_cholesterol} mmol/L",
            tc_status,
            "建议减少高胆固醇食物，增加有氧运动",
            "中国成人血脂异常防治指南"
        )

    ldl_status = get_status(bm.ldl, 3.4, 4.1)
    if ldl_status != "normal":
        add_sug(
            "低密度脂蛋白",
            f"{bm.ldl} mmol/L",
            ldl_status,
            "建议减少饱和脂肪摄入，增加植物甾醇食物",
            "中国成人血脂异常防治指南"
        )

    hdl_status = get_status_low(bm.hdl, 1.2, 1.0)
    if hdl_status != "normal":
        add_sug(
            "高密度脂蛋白",
            f"{bm.hdl} mmol/L",
            hdl_status,
            "建议增加有氧运动，适量摄入健康脂肪",
            "中国成人血脂异常防治指南"
        )

    tg_status = get_status(bm.triglycerides, 1.7, 2.3)
    if tg_status != "normal":
        add_sug(
            "甘油三酯",
            f"{bm.triglycerides} mmol/L",
            tg_status,
            "建议减少精制糖和酒精摄入，增加Omega-3脂肪酸",
            "中国成人血脂异常防治指南"
        )

    sys_status = get_status(bm.systolic_bp, 130, 140)
    dia_status = get_status(bm.diastolic_bp, 85, 90)
    bp_status = "danger" if sys_status == "danger" or dia_status == "danger" else \
                "warning" if sys_status == "warning" or dia_status == "warning" else "normal"
    if bp_status != "normal":
        add_sug(
            "血压",
            f"{bm.systolic_bp}/{bm.diastolic_bp} mmHg",
            bp_status,
            "建议限制钠摄入<2300mg/天，规律监测血压",
            "中国高血压防治指南"
        )
        if bp_status == "danger":
            add_sug(
                "血压",
                f"{bm.systolic_bp}/{bm.diastolic_bp} mmHg",
                bp_status,
                "建议尽早就医，评估是否需要启动降压治疗",
                "中国高血压防治指南"
            )

    bmi_status = get_status(bmi, 24, 28)
    if bmi_status != "normal":
        add_sug(
            "BMI指数",
            f"{bmi} kg/m²",
            bmi_status,
            "建议每周有氧运动≥150分钟，控制每日热量摄入",
            "中国居民膳食指南2022"
        )

    if ls.smoking:
        add_sug(
            "吸烟状态",
            "吸烟",
            "danger",
            "建议立即戒烟，可寻求医疗戒烟辅助",
            "WHO烟草控制框架公约"
        )

    if ls.drinking:
        add_sug(
            "饮酒状态",
            "饮酒",
            "warning",
            "建议限制酒精摄入，男性每日<25g，女性<15g",
            "中国居民膳食指南2022"
        )

    if ls.exercise_freq < 3:
        ex_status = "danger" if ls.exercise_freq < 1 else "warning"
        add_sug(
            "运动频率",
            f"{ls.exercise_freq} 次/周",
            ex_status,
            "建议每周至少运动3-5次，每次30分钟以上中等强度",
            "WHO运动指南"
        )

    sleep_status = get_status_low(ls.sleep_hours, 7, 6)
    if sleep_status != "normal":
        add_sug(
            "睡眠时间",
            f"{ls.sleep_hours} 小时/天",
            sleep_status,
            "建议保证每日7-8小时睡眠，建立规律作息",
            "中国睡眠研究会"
        )

    if not suggestions:
        add_sug(
            "综合评估",
            "良好",
            "normal",
            "各项指标正常，建议继续保持健康的生活方式",
            "健康体检常规建议"
        )

    return suggestions


def generate_trends(bi, bm, bmi: float) -> Dict[str, List[TrendPoint]]:
    trends: Dict[str, List[TrendPoint]] = {}
    today = datetime.now()

    def gen_points(current: float, variance: float) -> List[TrendPoint]:
        points = []
        base_val = current + random.uniform(-variance, variance)
        for i in range(5, 0, -1):
            d = today - timedelta(days=i * 60)
            val = round(base_val + random.uniform(-variance * 0.5, variance * 0.5), 2)
            points.append(TrendPoint(date=d.strftime("%Y-%m-%d"), value=val))
        points.append(TrendPoint(date=today.strftime("%Y-%m-%d"), value=round(current, 2)))
        return points

    trends["空腹血糖"] = gen_points(bm.fasting_glucose, 0.8)
    trends["总胆固醇"] = gen_points(bm.total_cholesterol, 0.6)
    trends["收缩压"] = gen_points(bm.systolic_bp, 8)
    trends["BMI"] = gen_points(bmi, 1.5)

    return trends
