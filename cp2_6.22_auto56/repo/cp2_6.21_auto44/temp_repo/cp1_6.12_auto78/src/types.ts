export interface User {
  id: string;
  nickname: string;
  color: string;
  socketId: string;
}

export interface CursorPosition {
  lineIndex: number;
  charIndex: number;
}

export interface UserCursor {
  userId: string;
  position: CursorPosition;
  selection?: {
    start: CursorPosition;
    end: CursorPosition;
  };
}

export interface Timestamp {
  id: string;
  lineIndex: number;
  time: number;
}

export interface LyricLine {
  id: string;
  text: string;
  timestamp?: Timestamp;
}

export interface RoomState {
  roomId: string;
  lines: LyricLine[];
  users: User[];
  cursors: Record<string, UserCursor>;
}

export type OperationType = 'insert' | 'delete' | 'replace';

export interface TextOperation {
  type: OperationType;
  lineIndex: number;
  charIndex: number;
  text?: string;
  length?: number;
  userId: string;
  version: number;
  timestamp: number;
}
