export interface Dimension {
  id: string;
  surveyId: string;
  emoji: string;
  label: string;
  allowText: boolean;
  sortOrder: number;
}

export interface Survey {
  id: string;
  code: string;
  title: string;
  description: string;
  createdAt: string;
  dimensions?: Dimension[];
}

export interface Rating {
  id: string;
  feedbackId: string;
  dimensionId: string;
  score: number;
  emoji?: string;
}

export interface Feedback {
  id: string;
  surveyId: string;
  text?: string;
  createdAt: string;
  ratings?: Rating[];
}

export interface CreateSurveyRequest {
  title: string;
  description: string;
  dimensions: Array<{
    emoji: string;
    label: string;
    allowText: boolean;
  }>;
}

export interface CreateFeedbackRequest {
  surveyId: string;
  ratings: Array<{
    dimensionId: string;
    score: number;
  }>;
  text?: string;
}

export interface SurveyStats {
  totalFeedbacks: number;
  averageRating: number;
  hourlyData: Array<{
    hour: string;
    count: number;
  }>;
}

export interface WebSocketMessage<T = unknown> {
  event: string;
  data: T;
}

export interface FeedbackEmitData {
  surveyId: string;
  ratings: Array<{
    dimensionId: string;
    score: number;
  }>;
  text?: string;
}

export interface FeedbackUpdateData {
  id: string;
  surveyId: string;
  ratings: Array<{
    dimensionId: string;
    score: number;
    emoji: string;
  }>;
  text?: string;
  createdAt: string;
}

export interface SubscribeData {
  surveyId: string;
}
