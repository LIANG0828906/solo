export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  totalPages: number;
  currentPage: number;
  createdAt: string;
}

export interface ReadingRecord {
  id: string;
  bookId: string;
  date: string;
  startPage: number;
  endPage: number;
  duration: number;
  tags: string[];
  notes: string;
}

export interface Goal {
  dailyMinutes: number;
  dailyPages: number;
}

export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  totalPages: number;
  totalMinutes: number;
  dailyBreakdown: {
    date: string;
    pages: number;
    minutes: number;
  }[];
  booksRead: string[];
  streakDays: number;
}

export interface MonthlyAnalytics {
  month: string;
  year: number;
  totalPages: number;
  totalMinutes: number;
  booksCompleted: number;
  booksStarted: number;
  weeklyBreakdown: WeeklyAnalytics[];
  topBooks: {
    bookId: string;
    title: string;
    pages: number;
  }[];
  averageDailyPages: number;
  averageDailyMinutes: number;
}

export interface BookProgressPayload {
  currentPage: number;
}

export type NavItem = {
  path: string;
  label: string;
  icon: string;
};
