export type BookStatus = 'to-read' | 'reading' | 'finished';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  startDate: string | null;
  lastReadMinutes: number;
  createdAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
}

export interface PresetBook {
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
}

export interface DailyMinute {
  date: string;
  minutes: number;
}

export interface WeeklyStats {
  weekTotalHours: number;
  monthFinishedCount: number;
  streakDays: number;
  streakActive: boolean;
  dailyMinutes: DailyMinute[];
}

export interface DailyBreakdown {
  date: string;
  minutes: number;
  noteCount: number;
}

export interface WeeklyReport {
  dateRange: { start: string; end: string };
  dailyBreakdown: DailyBreakdown[];
  totalHours: number;
  booksRead: string[];
  totalNotes: number;
}

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getBooks: () => request<Book[]>('/books'),
  addBook: (data: Partial<Book> & { title: string; author: string; coverUrl: string; totalPages: number }) =>
    request<Book>('/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id: string, data: Partial<Book>) =>
    request<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id: string) =>
    request<{ success: boolean }>(`/books/${id}`, { method: 'DELETE' }),

  getNotes: (bookId: string) => request<Note[]>(`/books/${bookId}/notes`),
  addNote: (bookId: string, content: string) =>
    request<Note>(`/books/${bookId}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),

  getWeeklyStats: () => request<WeeklyStats>('/stats/weekly'),
  getWeeklyReport: (weeksAgo = 0) =>
    request<WeeklyReport>(`/stats/report?weeksAgo=${weeksAgo}`),
  getPresetBooks: () => request<PresetBook[]>('/preset-books'),
};
