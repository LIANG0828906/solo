export interface Chapter {
  id: string;
  title: string;
  content: string;
  images?: string[];
  index: number;
}

export interface Book {
  id: string;
  title: string;
  cover?: string;
  chapters: Chapter[];
  totalChapters: number;
  uploadedAt: Date;
}

export type AnnotationType = 'highlight' | 'underline' | 'comment';

export interface Annotation {
  id: string;
  type: AnnotationType;
  chapterIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  comment?: string;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  chapterIndex: number;
  scrollPosition: number;
  text: string;
  createdAt: Date;
}

export interface ReadingState {
  currentChapter: number;
  scrollPercentage: number;
  annotations: Annotation[];
  bookmarks: Bookmark[];
  lastSavedAt?: Date;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
