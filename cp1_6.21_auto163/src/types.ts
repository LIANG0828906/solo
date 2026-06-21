export interface Student {
  id: string;
  name: string;
}

export interface QuizScore {
  score: number;
  date: string;
}

export interface Chapter {
  id: string;
  name: string;
  averageScore: number;
}

export interface ReviewItem {
  chapterName: string;
  averageScore: number;
}

export interface WeeklyReport {
  studentId: string;
  studentName: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  completedChapters: Chapter[];
  quizScores: QuizScore[];
  reviewItems: ReviewItem[];
  recommendedContent: string[];
  scoreTrend: string;
}

export interface ReportConfig {
  studentId: string;
  startDate: string;
  endDate: string;
  includeChart: boolean;
  includeRecommendations: boolean;
}
