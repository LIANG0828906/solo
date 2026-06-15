export interface DocDocument {
  id: string;
  title: string;
  content: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface CursorData {
  index: number;
  length: number;
}

export interface OnlineUser {
  userId: string;
  nickname: string;
  color: string;
  cursor?: CursorData;
}

export interface VersionSnapshot {
  id: string;
  docId: string;
  content: Record<string, unknown>;
  createdAt: number;
}

export interface ServerToClientEvents {
  "delta": (data: { docId: string; delta: Record<string, unknown>; userId: string }) => void;
  "cursor": (data: { docId: string; cursor: CursorData; userId: string }) => void;
  "user-joined": (data: { userId: string; nickname: string; color: string }) => void;
  "user-left": (data: { userId: string }) => void;
  "document-created": (data: { docId: string; title: string }) => void;
  "document-renamed": (data: { docId: string; title: string }) => void;
  "document-deleted": (data: { docId: string }) => void;
  "document-list": (data: DocDocument[]) => void;
  "document-content": (data: { docId: string; content: Record<string, unknown> }) => void;
  "version-saved": (data: { docId: string; version: VersionSnapshot }) => void;
  "online-users": (data: OnlineUser[]) => void;
  "version-list": (data: { docId: string; versions: VersionSnapshot[] }) => void;
}

export interface ClientToServerEvents {
  "delta": (data: { docId: string; delta: Record<string, unknown> }) => void;
  "cursor": (data: { docId: string; cursor: CursorData }) => void;
  "join-document": (data: { docId: string }) => void;
  "leave-document": (data: { docId: string }) => void;
  "create-document": (data: { title: string }) => void;
  "rename-document": (data: { docId: string; title: string }) => void;
  "delete-document": (data: { docId: string }) => void;
  "set-nickname": (data: { nickname: string }) => void;
  "rollback-version": (data: { docId: string; versionId: string }) => void;
}
