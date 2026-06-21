export interface Dimension {
  id: string;
  name: string;
  weight: number;
}

export interface Template {
  id: string;
  name: string;
  dimensions: Dimension[];
  createdAt: number;
}

export interface FeedbackRecord {
  id: string;
  templateId: string;
  scores: Record<string, number>;
  submittedAt: number;
}

export interface ReportData {
  id: string;
  templateId: string;
  templateName: string;
  averages: Record<string, number>;
  totalFeedbacks: number;
  dimensions: Dimension[];
  createdAt: number;
}

export interface CreateTemplateRequest {
  name: string;
  dimensions: Omit<Dimension, 'id'>[];
}

export interface SubmitFeedbackRequest {
  templateId: string;
  scores: Record<string, number>;
}
