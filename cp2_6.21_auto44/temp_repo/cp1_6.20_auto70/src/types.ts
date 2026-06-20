export type ReadingStatus = 'want_to_read' | 'reading' | 'read';

export type NoteTag = '核心观点' | '金句摘录' | '个人感悟';

export const NOTE_TAGS: NoteTag[] = ['核心观点', '金句摘录', '个人感悟'];

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: '想读',
  reading: '在读',
  read: '已读',
};

export const STATUS_COLORS: Record<ReadingStatus, { bg: string; text: string; gradient: string }> = {
  want_to_read: { bg: '#FFF3E0', text: '#E65100', gradient: 'linear-gradient(135deg, #FFD54F, #FF8A65)' },
  reading: { bg: '#E3F2FD', text: '#1565C0', gradient: 'linear-gradient(135deg, #6B8DAE, #4A7092)' },
  read: { bg: '#E8F5E9', text: '#2E7D32', gradient: 'linear-gradient(135deg, #8CB894, #5E9B6A)' },
};

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  coverUrl?: string;
  status: ReadingStatus;
  currentPage: number;
  lastReadDate: string;
  addedAt: string;
  readingDays: number;
  todayReadingMinutes: number;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
  wordCount: number;
  isStarred: boolean;
  tags: NoteTag[];
}

export interface MindMapNode {
  id: string;
  bookId: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
}

export interface AppData {
  books: Book[];
  notes: Note[];
  mindMapNodes: MindMapNode[];
}

export interface ImportResult {
  newBooks: number;
  newNotes: number;
  duplicates: number;
}

import { createContext } from 'react';

export interface AppContextType {
  selectedBookId: string | null;
  setSelectedBookId: (id: string | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const AppContext = createContext<AppContextType>({
  selectedBookId: null,
  setSelectedBookId: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
});
