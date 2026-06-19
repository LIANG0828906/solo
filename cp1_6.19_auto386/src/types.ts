export interface Course {
  id: string;
  name: string;
  description: string;
}

export interface Feedback {
  id: string;
  courseId: string;
  employeeName: string;
  avatarGradient: string;
  contentQuality: number;
  instructorExpression: number;
  practicalValue: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
}

export interface FeedbackSubmission {
  courseId: string;
  employeeName: string;
  contentQuality: number;
  instructorExpression: number;
  practicalValue: number;
  comment: string;
}

export interface AnalysisData {
  dailyAverages: { date: string; avgScore: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  totalFeedback: number;
  overallAvg: number;
  dailyFeedbackCounts: { date: string; count: number }[];
}

export interface StoreState {
  courses: Course[];
  selectedCourseId: string;
  feedbacks: Feedback[];
  analysisData: AnalysisData | null;
  dateRange: { start: string; end: string };
  sortOrder: 'newest' | 'oldest';
  currentPage: number;
  searchQuery: string;
  successMessage: string;

  setCourses: (courses: Course[]) => void;
  setSelectedCourseId: (id: string) => void;
  setFeedbacks: (feedbacks: Feedback[]) => void;
  setAnalysisData: (data: AnalysisData | null) => void;
  setDateRange: (range: { start: string; end: string }) => void;
  setSortOrder: (order: 'newest' | 'oldest') => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setSuccessMessage: (msg: string) => void;

  fetchCourses: () => Promise<void>;
  fetchAnalysis: (courseId: string) => Promise<void>;
  submitFeedback: (data: FeedbackSubmission) => Promise<void>;
  fetchFeedbacks: (courseId: string) => Promise<void>;
}
