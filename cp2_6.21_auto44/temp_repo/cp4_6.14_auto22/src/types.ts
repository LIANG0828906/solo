export interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface VersionSnapshot {
  id: string;
  version: number;
  chapterId: string;
  content: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorPosition: number;
  selectionStart?: number;
  selectionEnd?: number;
  lastActive?: number;
}

export interface Selection {
  start: number;
  end: number;
}

export type SyncMessageType =
  | 'content-update'
  | 'cursor-update'
  | 'chapter-add'
  | 'chapter-rename'
  | 'chapter-delete'
  | 'chapter-select'
  | 'version-add'
  | 'user-join'
  | 'user-leave'
  | 'hello'
  | 'state-request'
  | 'state-response';

export interface SyncMessage {
  type: SyncMessageType;
  senderId: string;
  timestamp: number;
  payload?: any;
}
