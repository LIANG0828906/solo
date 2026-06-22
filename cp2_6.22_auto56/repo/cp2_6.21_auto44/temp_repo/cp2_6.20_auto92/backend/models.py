from pydantic import BaseModel
from typing import List, Dict, Optional


class BasicInfo(BaseModel):
    age: int
    gender: str
    height: float
    weight: float


class BloodMetrics(BaseModel):
    fasting_glucose: float
    total_cholesterol: float
    triglycerides: float
    hdl: float
    ldl: float
    systolic_bp: int
    diastolic_bp: int


class Lifestyle(BaseModel):
    exercise_freq: int
    sleep_hours: float
    smoking: bool
    drinking: bool


class ReportData(BaseModel):
    employee_id: str
    employee_name: str
    department: str
    basic_info: BasicInfo
    blood_metrics: BloodMetrics
    lifestyle: Lifestyle


class RiskScores(BaseModel):
    cardiovascular: int
    metabolic: int
    respiratory: int
    digestive: int
    skeletal: int


class Suggestion(BaseModel):
    id: str
    metric: str
    current_value: str
    status: str
    advice: str
    source: str


class TrendPoint(BaseModel):
    date: str
    value: float


class AnalysisResult(BaseModel):
    report_id: str
    overall_score: int
    risk_scores: RiskScores
    trends: Dict[str, List[TrendPoint]]
    suggestions: List[Suggestion]
    report_date: str


class ReportSummary(BaseModel):
    id: str
    date: str
    overall_score: int
    key_abnormalities: List[str]


class HROverviewData(BaseModel):
    total_employees: int
    avg_score: float
    high_risk_count: int
    metric_distribution: List[Dict[str, object]]
    high_risk_employees: List[Dict[str, object]]


class ReportWithAnalysis(BaseModel):
    employee_id: str
    employee_name: str
    department: str
    basic_info: BasicInfo
    blood_metrics: BloodMetrics
    lifestyle: Lifestyle
    report_id: str
    overall_score: int
    risk_scores: RiskScores
    trends: Dict[str, List[TrendPoint]]
    suggestions: List[Suggestion]
    report_date: str
