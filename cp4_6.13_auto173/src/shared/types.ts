export type Language = 'english' | 'japanese' | 'french' | 'german' | 'spanish';

export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Diary {
  id: string;
  title: string;
  content: string;
  language: Language;
  level: Level;
  likes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryFormData {
  title: string;
  content: string;
  language: Language;
  level: Level;
}

export interface Comment {
  id: string;
  diaryId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface GrammarSuggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'grammar' | 'vocabulary' | 'spelling';
}

export interface PaginatedDiaries {
  data: Diary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LikeStatus {
  liked: boolean;
  likes: number;
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  english: '英语',
  japanese: '日语',
  french: '法语',
  german: '德语',
  spanish: '西班牙语',
};

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

export const LANGUAGE_COLORS: Record<Language, string> = {
  english: '#3498db',
  japanese: '#e74c3c',
  french: '#9b59b6',
  german: '#e67e22',
  spanish: '#2ecc71',
};

export const LEVEL_BG_COLORS: Record<Level, string> = {
  beginner: '#d4edda',
  intermediate: '#fff3cd',
  advanced: '#f8d7da',
};
