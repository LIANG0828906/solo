export interface Idea {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  votes: Record<string, 'up' | 'down' | null>;
  position: { x: number; y: number };
}

export interface User {
  id: string;
  nickname: string;
  socketId: string;
  isFirst: boolean;
}

export interface TimerState {
  duration: number;
  remaining: number;
  isRunning: boolean;
  isLocked: boolean;
  startedBy: string | null;
}

export interface RoomState {
  ideas: Idea[];
  users: User[];
  timer: TimerState;
}

export type VoteType = 'up' | 'down' | null;
