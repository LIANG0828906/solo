export interface User {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: number;
  lastEditedAt: number;
  lastEditor: string;
  collaborators: number;
}

export interface VersionSnapshot {
  id: string;
  documentId: string;
  content: string;
  timestamp: number;
  editorId: string;
  editorName: string;
  label?: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  position: number;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface OTAction {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface DocumentState {
  id: string;
  title: string;
  content: string;
  version: number;
  versions: VersionSnapshot[];
  onlineUsers: User[];
}
