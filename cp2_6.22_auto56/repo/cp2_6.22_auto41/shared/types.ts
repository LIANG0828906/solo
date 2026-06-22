export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  coverColor: string;
  status: 'unread' | 'reading' | 'finished';
}

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  date: string;
  duration: number;
  pagesRead: number;
}

export interface CalendarDay {
  date: string;
  totalDuration: number;
  totalPages: number;
  goalCompleted: boolean;
  sessions: ReadingSession[];
}
