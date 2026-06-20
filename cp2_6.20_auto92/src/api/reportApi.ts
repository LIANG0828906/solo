import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface BasicInfo {
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  employeeId?: string;
}

export interface BloodMetrics {
  systolic: number;
  diastolic: number;
  heartRate: number;
  totalCholesterol: number;
  triglycerides: number;
  hdl: number;
  ldl: number;
  fastingGlucose: number;
}

export interface Lifestyle {
  smoking: boolean;
  smokingFrequency?: number;
  drinking: boolean;
  drinkingFrequency?: number;
  exerciseFrequency: number;
  sleepHours: number;
  stressLevel: number;
}

export interface ReportData {
  basicInfo: BasicInfo;
  bloodMetrics: BloodMetrics;
  lifestyle: Lifestyle;
}

export interface RiskDimension {
  name: string;
  score: number;
  level: 'low' | 'medium' | 'high';
  description: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface Trends {
  [key: string]: TrendPoint[];
}

export interface Suggestion {
  id: string;
  category: 'diet' | 'exercise' | 'lifestyle' | 'medical';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  id: string;
  reportId: string;
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  risks: RiskDimension[];
  trends: Trends;
  suggestions: Suggestion[];
  createdAt: string;
}

export interface ReportWithAnalysis {
  id: string;
  employeeId: string;
  reportDate: string;
  data: ReportData;
  analysis: AnalysisResult;
}

export interface ReportSummary {
  id: string;
  reportDate: string;
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  mainRisks: string[];
}

export interface EmployeeHealthStats {
  employeeId: string;
  name: string;
  reportCount: number;
  avgScore: number;
  latestScore: number;
  trend: 'up' | 'down' | 'stable';
  highRiskCount: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface HROverviewData {
  totalEmployees: number;
  totalReports: number;
  avgOverallScore: number;
  riskDistribution: RiskDistribution;
  topRisks: { name: string; count: number }[];
  employeesAtRisk: EmployeeHealthStats[];
  recentReports: ReportSummary[];
  departmentStats?: { department: string; avgScore: number; employeeCount: number }[];
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
