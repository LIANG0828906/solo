export interface TeamMember {
  id: string;
  name: string;
  role: 'host' | 'participant';
  avatar?: string;
}

export interface TemplateQuestion {
  id: string;
  text: string;
  type: 'open' | 'rating';
  order: number;
}

export interface TemplatePhase {
  id: string;
  name: string;
  order: number;
  questions: TemplateQuestion[];
}

export interface RetrospectiveTemplate {
  id: string;
  name: string;
  description: string;
  phases: TemplatePhase[];
  createdAt: string;
  updatedAt: string;
}

export interface RetrospectiveSession {
  id: string;
  projectId: string;
  projectName: string;
  templateId: string;
  status: 'draft' | 'active' | 'completed';
  members: TeamMember[];
  createdAt: string;
  completedAt?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  memberId: string;
  content: string;
  rating?: number;
  isAnonymous: boolean;
  createdAt: string;
  memberName?: string;
}

export interface QuestionStats {
  questionId: string;
  questionText: string;
  questionType: 'open' | 'rating';
  averageRating: number;
  ratingDistribution: number[];
  answerCount: number;
  answers: Answer[];
}

export interface Comment {
  id: string;
  answerId: string;
  memberId: string;
  memberName: string;
  content: string;
  parentId?: string;
  likes: number;
  createdAt: string;
  replies: Comment[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface ActionSuggestion {
  title: string;
  keyword: string;
  frequency: number;
}

export interface RadarDataPoint {
  dimension: string;
  value: number;
  sessionId: string;
  sessionName: string;
}

export interface RadarSeries {
  name: string;
  sessionId: string;
  color: string;
  data: { dimension: string; value: number }[];
  visible: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  retrospectives: RetrospectiveSession[];
}

export type ThemeMode = 'dark' | 'light';
