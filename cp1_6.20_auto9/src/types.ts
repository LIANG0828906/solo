export interface User {
  id: string;
  name: string;
  color: string;
  cursor: CursorPosition | null;
}

export interface CursorPosition {
  start: number;
  end: number;
}

export interface Operation {
  type: 'replace';
  content: string;
}

export interface DocVersion {
  id: string;
  versionNumber: number;
  content: string;
  timestamp: number;
  userId: string;
  userName: string;
  restoredFrom?: string;
}

export interface WSMessage {
  type: 'init' | 'operation' | 'cursor' | 'presence' | 'version-created' | 'restore-version' | 'rename';
  clientId?: string;
  name?: string;
  color?: string;
  content?: string;
  versions?: DocVersion[];
  operation?: Operation;
  userId?: string;
  cursor?: CursorPosition | null;
  users?: User[];
  version?: DocVersion;
  versionId?: string;
  restored?: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
