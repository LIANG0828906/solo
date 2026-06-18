export interface Comment {
  id: string;
  start: number;
  end: number;
  text: string;
  author: string;
  authorColor: string;
  resolved: boolean;
  replies: Reply[];
  createdAt: number;
}

export interface Reply {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface Version {
  id: string;
  content: string;
  comments: Comment[];
  wordCount: number;
  createdAt: number;
}

export interface UserInfo {
  id: string;
  name: string;
  color: string;
  cursorPosition: number;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface EditOp {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  timestamp: number;
  userId: string;
}

export interface ConflictInfo {
  id: string;
  localOp: EditOp;
  remoteOp: EditOp;
  localContent: string;
  remoteContent: string;
  userId: string;
  userName: string;
}

export type ClientMessage =
  | { type: 'join'; documentId: string; userId: string; userName: string }
  | { type: 'leave'; documentId: string; userId: string }
  | { type: 'edit'; documentId: string; userId: string; op: EditOp }
  | { type: 'cursor'; documentId: string; userId: string; position: number }
  | { type: 'selection'; documentId: string; userId: string; start: number; end: number }
  | { type: 'comment'; documentId: string; comment: Comment }
  | { type: 'resolveComment'; documentId: string; commentId: string; resolved: boolean }
  | { type: 'replyComment'; documentId: string; commentId: string; reply: Reply };

export type ServerMessage =
  | { type: 'init'; content: string; comments: Comment[]; users: UserInfo[] }
  | { type: 'users'; users: UserInfo[] }
  | { type: 'userJoin'; user: UserInfo }
  | { type: 'userLeave'; userId: string }
  | { type: 'edit'; userId: string; op: EditOp }
  | { type: 'cursor'; userId: string; position: number; color: string }
  | { type: 'selection'; userId: string; start: number; end: number; color: string }
  | { type: 'comment'; comment: Comment }
  | { type: 'resolveComment'; commentId: string; resolved: boolean }
  | { type: 'replyComment'; commentId: string; reply: Reply }
  | { type: 'conflict'; conflict: ConflictInfo };

export interface DocumentState {
  content: string;
  comments: Comment[];
  versions: Version[];
  lastSavedAt: number;
}
