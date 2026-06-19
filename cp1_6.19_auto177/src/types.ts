export interface ScoreDimension {
  id: string;
  name: string;
  weight: number;
}

export interface Assignment {
  id: string;
  title: string;
  deadline: string;
  totalScore: number;
  dimensions: ScoreDimension[];
  createdAt: string;
  submittedCount: number;
  reviewedCount: number;
  totalStudents: number;
  status: 'pending' | 'submitting' | 'reviewing' | 'finished';
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  paragraphs: string[];
  keywords: string[];
  submittedAt: string;
  hasSubmitted: boolean;
}

export interface ScoreRecord {
  id: string;
  assignmentId: string;
  submissionId: string;
  raterId: string;
  scores: Record<string, number>;
  totalScore: number;
  submittedAt: string;
}

export interface ConsistencyMetrics {
  assignmentId: string;
  kendallW: number;
  cohenKappa: number;
  isAlert: boolean;
  calculatedAt: string;
}

export interface RaterBiasData {
  raterId: string;
  raterName: string;
  assignmentId: string;
  biasValue: number;
  meanScore: number;
  globalMean: number;
}

export interface BiasTrendPoint {
  assignmentId: string;
  assignmentTitle: string;
  biasValue: number;
  date: string;
}

export enum AppEventType {
  SCORE_SUBMITTED = 'SCORE_SUBMITTED',
  ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
  SUBMISSION_SUBMITTED = 'SUBMISSION_SUBMITTED',
  CONSISTENCY_CALCULATED = 'CONSISTENCY_CALCULATED',
  BIAS_CALCULATED = 'BIAS_CALCULATED',
}

export interface ScoreSubmittedPayload {
  assignmentId: string;
  submissionId: string;
  raterId: string;
}

export type AppEventPayload = ScoreSubmittedPayload | Assignment | Submission | ConsistencyMetrics | Record<string, RaterBiasData[]>;

export interface AppState {
  assignments: Assignment[];
  submissions: Submission[];
  scoreRecords: ScoreRecord[];
  consistencyMetrics: Record<string, ConsistencyMetrics>;
  raterBiasData: Record<string, RaterBiasData[]>;
  raterBiasTrends: Record<string, BiasTrendPoint[]>;
  selectedAssignmentId: string | null;
  currentUserId: string;
  userRole: 'teacher' | 'student';
  students: { id: string; name: string }[];
}
