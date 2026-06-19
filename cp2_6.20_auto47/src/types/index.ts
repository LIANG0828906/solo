export type Template = 'business' | 'tech' | 'creative';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
  startDate: string;
  endDate: string | null;
}

export interface ResumeSection {
  id: string;
  type: 'personalInfo' | 'workExperience' | 'education' | 'skills' | 'projects' | 'custom';
  title: string;
  order: number;
  visible: boolean;
}

export interface Resume {
  id: string;
  title: string;
  template: Template;
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  content: string;
  category: string;
  difficulty: Difficulty;
  hints: string[];
  sampleAnswer?: string;
  order: number;
}

export interface QuestionFeedback {
  questionId: string;
  score: number;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

export interface InterviewSession {
  id: string;
  resumeId: string;
  difficulty: Difficulty;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  feedback: QuestionFeedback[];
  startTime: string;
  endTime: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  overallScore?: number;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface TimeDataPoint {
  timestamp: string;
  score: number;
  label?: string;
}

export interface QuestionResult {
  questionId: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
  duration: number;
}

export interface AnalysisReport {
  id: string;
  sessionId: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
  timeData: TimeDataPoint[];
  questionResults: QuestionResult[];
  summary: string;
  recommendations: string[];
  createdAt: string;
}

export interface GenerateQuestionsRequest {
  resumeId: string;
  difficulty: Difficulty;
  category?: string;
  count?: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  duration: number;
}
