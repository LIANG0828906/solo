export interface Project {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  isCompleted: boolean;
  isExpanded?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterContent {
  chapterId: string;
  content: string;
  wordCount: number;
  lastSavedAt: string;
}

export interface VersionHistory {
  id: string;
  chapterId: string;
  content: string;
  snapshotName: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string;
}

export interface Comment {
  id: string;
  chapterId: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  parentCommentId: string | null;
  startOffset: number;
  endOffset: number;
  resolved?: boolean;
}

export type DiffOp = 'equal' | 'insert' | 'delete';

export interface DiffSegment {
  op: DiffOp;
  text: string;
}
