export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified';

export type ReviewStatus = 'accepted' | 'rejected' | 'pending' | null;

export interface DiffSegment {
  id: string;
  type: DiffType;
  originalLines: { start: number; end: number };
  revisedLines: { start: number; end: number };
  originalText: string;
  revisedText: string;
  status: ReviewStatus;
}

export interface User {
  id: string;
  nickname: string;
  avatarColor: string;
}

export interface Comment {
  id: string;
  segmentId: string;
  userId: string;
  userNickname: string;
  avatarColor: string;
  content: string;
  replyToNickname?: string;
  timestamp: number;
}

export interface ReviewTask {
  id: string;
  originalText: string;
  revisedText: string;
  segments: DiffSegment[];
  comments: Comment[];
  createdAt: number;
  updatedAt: number;
}

export type WebSocketEventType =
  | 'diff_result'
  | 'status_updated'
  | 'comment_added'
  | 'user_editing'
  | 'task_saved'
  | 'task_loaded'
  | 'task_not_found'
  | 'error';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: number;
  userId?: string;
  userName?: string;
}

export interface DiffResultPayload {
  segments: DiffSegment[];
  originalText: string;
  revisedText: string;
}

export interface StatusUpdatePayload {
  segmentId: string;
  status: ReviewStatus;
}

export interface CommentPayload {
  comment: Comment;
}

export interface UserEditingPayload {
  segmentId: string;
  userName: string;
}

export interface SaveTaskPayload {
  taskId: string;
  originalText: string;
  revisedText: string;
  segments: DiffSegment[];
  comments: Comment[];
}

export interface LoadTaskPayload {
  taskId: string;
}

export interface TaskLoadedPayload {
  task: ReviewTask;
}
