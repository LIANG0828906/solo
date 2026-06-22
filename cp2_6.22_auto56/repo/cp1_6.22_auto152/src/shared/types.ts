export interface EvaluationIndicator {
  id: string;
  name: string;
  weight: number;
  description: string;
  dimensionId: string;
}

export interface EvaluationDimension {
  id: string;
  name: string;
  indicators: EvaluationIndicator[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
}

export interface EvaluationCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deadline: string;
  dimensions: EvaluationDimension[];
}

export interface EvaluationTask {
  id: string;
  cycleId: string;
  cycleName: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluateeId: string;
  evaluateeName: string;
  evaluateeEmail: string;
  deadline: string;
  dimensions: EvaluationDimension[];
  status: 'pending' | 'completed';
  submittedAt?: string;
}

export interface ScoreSubmission {
  scores: Record<string, number>;
}

export interface IndicatorScore {
  indicatorId: string;
  indicatorName: string;
  score: number;
  weight: number;
}

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  averageScore: number;
  indicators: IndicatorScore[];
}

export interface EvaluationResult {
  taskId: string;
  cycleId: string;
  cycleName: string;
  evaluateeId: string;
  evaluateeName: string;
  totalScore: number;
  dimensions: DimensionScore[];
  submittedAt: string;
}

export interface HistoryRecord {
  id: string;
  cycleName: string;
  submittedAt: string;
  totalScore: number;
  dimensions: DimensionScore[];
}
