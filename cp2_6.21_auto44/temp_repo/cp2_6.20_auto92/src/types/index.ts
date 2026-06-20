import type {
  BasicInfo,
  BloodMetrics,
  Lifestyle,
  ReportData,
  RiskScores,
  TrendPoint,
  Suggestion,
  AnalysisResult,
  ReportWithAnalysis,
  ReportSummary,
  HROverviewData,
  MetricDistribution,
  HighRiskEmployee,
} from '../api/reportApi';

export {
  type BasicInfo,
  type BloodMetrics,
  type Lifestyle,
  type ReportData,
  type RiskScores,
  type TrendPoint,
  type Suggestion,
  type AnalysisResult,
  type ReportWithAnalysis,
  type ReportSummary,
  type HROverviewData,
  type MetricDistribution,
  type HighRiskEmployee,
};

export {
  submitReport,
  getReport,
  getEmployeeReports,
  getHROverview,
} from '../api/reportApi';

export const RISK_DIMENSION_LABELS: Record<keyof RiskScores, string> = {
  cardiovascular: '心血管',
  metabolic: '代谢',
  respiratory: '呼吸',
  digestive: '消化',
  skeletal: '骨骼',
};

export const RISK_DIMENSION_KEYS: (keyof RiskScores)[] = [
  'cardiovascular',
  'metabolic',
  'respiratory',
  'digestive',
  'skeletal',
];

export const METRIC_OPTIONS = [
  { key: '空腹血糖', label: '空腹血糖 (mmol/L)' },
  { key: '总胆固醇', label: '总胆固醇 (mmol/L)' },
  { key: '收缩压', label: '收缩压 (mmHg)' },
  { key: 'BMI', label: 'BMI (kg/m²)' },
];

export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#38a169';
  if (score >= 70) return '#d69e2e';
  if (score >= 60) return '#dd6b20';
  return '#e53e3e';
};

export const getScoreLevel = (score: number): string => {
  if (score >= 90) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 60) return '一般';
  return '较差';
};

export const getStatusColor = (status: 'normal' | 'warning' | 'danger'): string => {
  switch (status) {
    case 'normal': return '#38a169';
    case 'warning': return '#dd6b20';
    case 'danger': return '#e53e3e';
    default: return '#718096';
  }
};
