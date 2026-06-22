export interface User {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  color: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
  online?: boolean;
}

export interface Version {
  id: string;
  documentId: string;
  content: string;
  timestamp: number;
  author: string;
  authorId: string;
  name: string;
  isAuto: boolean;
}

export interface DocumentData {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  inviteLink: string;
  lockedBy?: string;
  lockExpiresAt?: number;
  users: User[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
  oldLineNumber?: number;
}

export interface CursorPosition {
  userId: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
}
