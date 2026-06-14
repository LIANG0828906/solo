export type QuestionType = 'single' | 'multiple' | 'fill';

export type Difficulty = 'basic' | 'medium' | 'hard';

export type MatchMode = 'strict' | 'fuzzy';

export interface Course {
  id: string;
  name: string;
  chapters: Chapter[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  name: string;
  knowledgePoints: string[];
}

export interface QuestionOption {
  key: string;
  content: string;
}

export interface Question {
  id: string;
  chapterId: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  knowledgePoint: string;
  score: number;
  options?: QuestionOption[];
  correctAnswer?: string[];
  fillAnswers?: { answer: string; mode: MatchMode }[];
  explanation: string;
  createdAt: string;
}

export interface Paper {
  id: string;
  title: string;
  chapterId: string;
  questionIds: string[];
  totalScore: number;
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string[];
}

export interface PaperSubmission {
  id: string;
  paperId: string;
  studentName: string;
  answers: StudentAnswer[];
  submittedAt: string;
}

export interface GradingResult {
  submissionId: string;
  questionResults: {
    questionId: string;
    isCorrect: boolean;
    score: number;
    maxScore: number;
    studentAnswer: string[];
    correctAnswer: string[];
    autoGraded: boolean;
    teacherComment?: string;
  }[];
  totalScore: number;
  gradedAt: string;
}

export interface KnowledgePointStat {
  name: string;
  errorCount: number;
  totalCount: number;
}

export type WeakPoint = KnowledgePointStat;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StudentInfo {
  name: string;
  [key: string]: any;
}

export type Submission = PaperSubmission;

export interface ManualGradeDto {
  submissionId: string;
  questionId: string;
  score: number;
  comment?: string;
}

export interface PaperCreateDto {
  title: string;
  chapterId: string;
  questionIds: string[];
}

export interface SubmissionCreateDto {
  paperId: string;
  studentName: string;
  answers: StudentAnswer[];
}

export interface QuestionCreateDto {
  chapterId: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  knowledgePoint: string;
  score: number;
  options?: QuestionOption[];
  correctAnswer?: string[];
  fillAnswers?: { answer: string; mode: MatchMode }[];
  explanation: string;
}

export type QuestionUpdateDto = Partial<QuestionCreateDto>;

export interface QuestionQueryParams {
  chapterId?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
}
