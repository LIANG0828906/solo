export interface ReadingPlan {
  id: string;
  bookTitle: string;
  author: string;
  totalChapters: number;
  totalPages: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  dailyAssignments: DailyAssignment[];
  milestones: Milestone[];
  members: Member[];
}

export interface DailyAssignment {
  date: string;
  startPage: number;
  endPage: number;
  pageCount: number;
  isCompleted: boolean;
  completedBy: string[];
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
  totalPagesRead: number;
  dailyProgress: DailyProgress[];
}

export interface DailyProgress {
  date: string;
  pagesRead: number;
}

export interface Milestone {
  id: string;
  chapter: number;
  completedAt: string;
  title: string;
  comments: Comment[];
  likes: string[];
}

export interface Comment {
  id: string;
  memberId: string;
  content: string;
  createdAt: string;
}

export interface ChartDataPoint {
  date: string;
  planned: number;
  actual: number;
}
