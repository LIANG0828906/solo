export interface Document {
  id: string;
  content: string;
  plainText: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CommentReply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  content: string;
  author: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  replies: CommentReply[];
}

export interface Version {
  id: string;
  version: number;
  content: string;
  plainText: string;
  createdAt: string;
  createdBy: string;
  description?: string;
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber: number;
}

export interface DiffResult {
  baseId: string;
  targetId: string;
  diff: DiffSegment[];
}

export interface CreateCommentData {
  text: string;
  startOffset: number;
  endOffset: number;
  content: string;
  author: string;
}
