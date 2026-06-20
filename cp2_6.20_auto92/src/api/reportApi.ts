import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface BasicInfo {
  age: number;
  gender: string;
  height: number;
  weight: number;
}

export interface BloodMetrics {
  fasting_glucose: number;
  total_cholesterol: number;
  triglycerides: number;
  hdl: number;
  ldl: number;
  systolic_bp: number;
  diastolic_bp: number;
}

export interface Lifestyle {
  exercise_freq: number;
  sleep_hours: number;
  smoking: boolean;
  drinking: boolean;
}

export interface ReportData {
  employee_id: string;
  employee_name: string;
  department: string;
  basic_info: BasicInfo;
  blood_metrics: BloodMetrics;
  lifestyle: Lifestyle;
}

export interface RiskScores {
  cardiovascular: number;
  metabolic: number;
  respiratory: number;
  digestive: number;
  skeletal: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface Suggestion {
  id: string;
  metric: string;
  current_value: string;
  status: 'normal' | 'warning' | 'danger';
  advice: string;
  source: string;
}

export interface AnalysisResult {
  report_id: string;
  overall_score: number;
  risk_scores: RiskScores;
  trends: Record<string, TrendPoint[]>;
  suggestions: Suggestion[];
  report_date: string;
}

export interface ReportSummary {
  id: string;
  date: string;
  overall_score: number;
  key_abnormalities: string[];
}

export interface MetricDistribution {
  metric: string;
  count: number;
}

export interface HighRiskEmployee {
  name: string;
  department: string;
  score: number;
  abnormalities: string[];
}

export interface HROverviewData {
  total_employees: number;
  avg_score: number;
  high_risk_count: number;
  metric_distribution: MetricDistribution[];
  high_risk_employees: HighRiskEmployee[];
}

export interface ReportWithAnalysis {
  employee_id: string;
  employee_name: string;
  department: string;
  basic_info: BasicInfo;
  blood_metrics: BloodMetrics;
  lifestyle: Lifestyle;
  report_id: string;
  overall_score: number;
  risk_scores: RiskScores;
  trends: Record<string, TrendPoint[]>;
  suggestions: Suggestion[];
  report_date: string;
}

export const submitReport = async (data: ReportData): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>('/api/reports', data);
  return response.data;
};

export const getReport = async (id: string): Promise<ReportWithAnalysis> => {
  const response = await api.get<ReportWithAnalysis>(`/api/reports/${id}`);
  return response.data;
};

export const getEmployeeReports = async (employeeId: string): Promise<ReportSummary[]> => {
  const response = await api.get<ReportSummary[]>(`/api/employees/${employeeId}/reports`);
  return response.data;
};

export const getHROverview = async (): Promise<HROverviewData> => {
  const response = await api.get<HROverviewData>('/api/hr/overview');
  return response.data;
};

export default api;
