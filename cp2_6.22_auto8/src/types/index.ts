export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  fileType: 'epub' | 'pdf';
  fileData: ArrayBuffer;
  chapters: Chapter[];
  totalPages: number;
  status: 'unread' | 'reading' | 'finished';
  progress: number;
  currentChapter: string;
  scrollPosition: number;
  createdAt: Date;
  lastReadAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  href?: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface Annotation {
  id: string;
  bookId: string;
  chapterId: string;
  type: 'highlight' | 'note';
  color: 'yellow' | 'green' | 'blue' | 'pink';
  text: string;
  content: string;
  startOffset: number;
  endOffset: number;
  createdAt: Date;
}

export interface ReadingProgress {
  bookId: string;
  currentChapter: string;
  scrollPosition: number;
  progress: number;
  updatedAt: Date;
}

export type ThemeType = 'light' | 'eye-care' | 'dark' | 'parchment';

export interface ThemeConfig {
  background: string;
  text: string;
  accent: string;
  name: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  'light': {
    background: '#FFFFFF',
    text: '#2C1810',
    accent: '#8B5E3C',
    name: '明亮模式'
  },
  'eye-care': {
    background: '#C7EDCC',
    text: '#2C1810',
    accent: '#8B5E3C',
    name: '护眼模式'
  },
  'dark': {
    background: '#1A1A2E',
    text: '#E8E8E8',
    accent: '#A67C52',
    name: '深色模式'
  },
  'parchment': {
    background: '#F4E4BC',
    text: '#2C1810',
    accent: '#8B5E3C',
    name: '羊皮纸模式'
  }
};

export const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: '#FFD93D',
  green: '#6BCB77',
  blue: '#4D96FF',
  pink: '#FF6B9D'
};

export interface FilterOptions {
  author: string;
  status: string;
  progress: string;
  search: string;
}
