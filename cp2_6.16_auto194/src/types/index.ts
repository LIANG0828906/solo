export type AnnotationType = 'suggestion' | 'question' | 'error';

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplyItem {
  id: string;
  annotationId: string;
  content: string;
  author: string;
  authorColor: string;
  createdAt: string;
}

export interface AnnotationItem {
  id: string;
  documentId: string;
  type: AnnotationType;
  content: string;
  author: string;
  authorColor: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  createdAt: string;
  replies: ReplyItem[];
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: number;
}

export interface AnnotationStats {
  total: number;
  suggestion: number;
  question: number;
  error: number;
  suggestionPercent: number;
  questionPercent: number;
  errorPercent: number;
  recentAnnotations: AnnotationItem[];
}
