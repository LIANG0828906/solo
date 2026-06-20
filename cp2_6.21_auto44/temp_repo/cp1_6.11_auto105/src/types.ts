export interface User {
  id: string;
  nickname: string;
  roomId: string;
  color: string;
  avatarColor: string;
  isHost: boolean;
  danmakuCount: number;
}

export interface Danmaku {
  id: string;
  userId: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  createdAt: number;
  trail: TrailPoint[];
}

export interface TrailPoint {
  x: number;
  y: number;
  size: number;
  createdAt: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  createdAt: number;
}

export type ClientMessage =
  | { type: 'join'; nickname: string; roomId: string }
  | { type: 'danmaku'; danmaku: Omit<Danmaku, 'trail'> }
  | { type: 'setColor'; color: string }
  | { type: 'clearCanvas' };

export type ServerMessage =
  | { type: 'init'; selfId: string; users: User[]; isHost: boolean }
  | { type: 'userJoin'; user: User }
  | { type: 'userLeave'; userId: string }
  | { type: 'userUpdate'; user: User }
  | { type: 'danmaku'; danmaku: Omit<Danmaku, 'trail'> }
  | { type: 'clearCanvas' }
  | { type: 'error'; message: string };
