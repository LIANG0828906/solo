export interface InterviewQuestion {
  id: string;
  text: string;
  duration: number;
}

export interface Interview {
  id: string;
  title: string;
  questions: InterviewQuestion[];
  candidateEmail: string;
  candidateName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated';
  createdAt: string;
  inviteLink: string;
}

export interface CreateInterviewRequest {
  title: string;
  questions: Omit<InterviewQuestion, 'id'>[];
  candidateEmail: string;
}

export interface CreateInterviewResponse {
  success: boolean;
  interview: Interview;
  inviteLink: string;
  emailSent: boolean;
}

export interface VerifyCandidateRequest {
  interviewId: string;
  name: string;
  email: string;
}

export interface VerifyCandidateResponse {
  success: boolean;
  interview: Interview;
  token: string;
}

export interface ScoreItem {
  questionId: string;
  score: number;
  comment?: string;
}

export interface VoiceComment {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
  waveformData: number[];
}

export interface SubmitEvaluationRequest {
  interviewId: string;
  scores: ScoreItem[];
  voiceComments?: VoiceComment[];
}

export interface SubmitEvaluationResponse {
  success: boolean;
  evaluationId: string;
}

export interface EvaluationDimensions {
  expression: number;
  logic: number;
  technicalDepth: number;
  adaptability: number;
  timeManagement: number;
}

export interface EvaluationResult {
  id: string;
  interviewId: string;
  evaluatorName: string;
  scores: ScoreItem[];
  averageScore: number;
  totalScore: number;
  voiceComments: VoiceComment[];
  dimensions: EvaluationDimensions;
}

export interface UploadChunkResponse {
  success: boolean;
  chunkIndex: number;
  uploaded: boolean;
}

export interface CompleteUploadResponse {
  success: boolean;
  videoUrl: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'interviewer' | 'evaluator' | 'candidate';
}
