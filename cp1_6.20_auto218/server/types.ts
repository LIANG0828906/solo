export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: string;
  scriptId: string;
  versionNumber: number;
  content: string;
  author: string;
  createdAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatarColor: string;
  currentLine?: number;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber: number;
}

export interface DiffResult {
  added: number;
  removed: number;
  modified: number;
  changes: DiffChange[];
}

export interface EditorMessage {
  type: 'edit' | 'cursor' | 'save' | 'join' | 'leave';
  scriptId: string;
  userId: string;
  payload: unknown;
}
