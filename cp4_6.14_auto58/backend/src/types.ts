export interface RawDraftContentState {
  entityMap: Record<string, unknown>;
  blocks: Array<{
    key: string;
    type: string;
    text: string;
    depth: number;
    inlineStyleRanges: Array<{ offset: number; length: number; style: string }>;
    entityRanges: Array<{ offset: number; length: number; key: number }>;
    data?: Record<string, unknown>;
  }>;
}

export interface Document {
  id: string;
  content: RawDraftContentState;
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
  createdAt: string;
  createdBy: string;
  description?: string;
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}
