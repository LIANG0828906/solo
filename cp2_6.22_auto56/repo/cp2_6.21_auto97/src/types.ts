export type BlockType = 'text' | 'image' | 'code';
export type VoteType = 'happy' | 'sad' | 'surprised';

export interface VoteCounts {
  happy: number;
  sad: number;
  surprised: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  language?: string;
  votes: VoteCounts;
  createdAt: number;
  updatedAt: number;
}

export interface Connection {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  createdAt: number;
}

export interface WikiPage {
  id: string;
  title: string;
  blocks: Block[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
}

export interface VersionHistory {
  id: string;
  pageId: string;
  version: number;
  author: string;
  authorInitials: string;
  timestamp: number;
  summary: string;
  snapshot: WikiPage;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  userInitials: string;
  color: string;
  blockId: string;
  offset: number;
  x: number;
  y: number;
}

export interface OutlineItem {
  id: string;
  blockId: string;
  text: string;
  level: number;
  children: OutlineItem[];
  collapsed: boolean;
}

export type OTOperation =
  | { type: 'insert'; position: number; text: string; blockId: string }
  | { type: 'delete'; position: number; length: number; blockId: string }
  | { type: 'retain'; length: number; blockId: string };

export interface OnlineUser {
  userId: string;
  userName: string;
  userInitials: string;
  color: string;
  cursor?: CursorPosition;
}
