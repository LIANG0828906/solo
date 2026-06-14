export interface Question {
  id: string
  type: 'choice' | 'fill' | 'essay'
  content: string
  options?: string[]
  answer: string
  knowledgePoint: string
  difficulty: 1 | 2 | 3 | 4 | 5
  courseId: string
  chapterId: string
  createdAt: string
  updatedAt: string
}

export interface QuestionCreateDto {
  type: 'choice' | 'fill' | 'essay'
  content: string
  options?: string[]
  answer: string
  knowledgePoint: string
  difficulty: 1 | 2 | 3 | 4 | 5
  courseId: string
  chapterId: string
}

export interface QuestionUpdateDto {
  type?: 'choice' | 'fill' | 'essay'
  content?: string
  options?: string[]
  answer?: string
  knowledgePoint?: string
  difficulty?: 1 | 2 | 3 | 4 | 5
  courseId?: string
  chapterId?: string
}

export interface QuestionQueryParams {
  courseId?: string
  chapterId?: string
  type?: 'choice' | 'fill' | 'essay'
  knowledgePoint?: string
  difficulty?: 1 | 2 | 3 | 4 | 5
  page?: number
  pageSize?: number
}

export interface Paper {
  id: string
  title: string
  courseId: string
  questionIds: string[]
  questions?: Question[]
  totalScore: number
  duration: number
  createdAt: string
  updatedAt: string
}

export interface PaperCreateDto {
  title: string
  courseId: string
  questionIds: string[]
  totalScore: number
  duration: number
}

export interface AnswerItem {
  questionId: string
  answer: string
}

export interface SubmissionCreateDto {
  paperId: string
  studentName: string
  answers: AnswerItem[]
}

export interface Submission {
  id: string
  paperId: string
  paper?: Paper
  studentName: string
  answers: AnswerItem[]
  scores: Record<string, number>
  comments: Record<string, string>
  totalScore: number
  isAutoGraded: boolean
  isManualGraded: boolean
  submittedAt: string
  gradedAt?: string
}

export interface ManualGradeDto {
  submissionId: string
  questionId: string
  score: number
  comment?: string
}

export interface WeakPoint {
  knowledgePoint: string
  errorCount: number
  totalCount: number
  errorRate: number
}

export interface StudentInfo {
  name: string
  studentId?: string
  className?: string
}

export interface Course {
  id: string
  name: string
}

export interface Chapter {
  id: string
  name: string
  courseId: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
