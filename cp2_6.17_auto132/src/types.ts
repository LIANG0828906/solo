export interface ApplicationData {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  companyName: string;
  avgRevenue: number;
  hasCollateral: boolean;
}

export interface AssessmentResult {
  applicationId: string;
  score: number;
  estimatedAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
}
