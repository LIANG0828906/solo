export interface Document {
  id: string;
  content: string;
  plainText: string;
  updatedAt: number;
  updatedBy: string;
}

export interface CommentReply {
  id: string;
  content: string;
  author: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  content: string;
  author: string;
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  replies: CommentReply[];
}

export interface Version {
  id: string;
  version: number;
  content: string;
  createdAt: number;
  createdBy: string;
  description?: string;
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export interface DiffResult {
  baseVersion: number;
  targetVersion: number;
  diffs: DiffSegment[];
}

export interface CreateCommentData {
  text: string;
  startOffset: number;
  endOffset: number;
  content: string;
  author: string;
}
