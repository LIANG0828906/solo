export interface Point {
  x: number;
  y: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface DrawPath {
  id: string;
  type: 'path';
  points: Point[];
  color: string;
  width: number;
  userId: string;
  likes: string[];
  comments: Comment[];
}

export interface Note {
  id: string;
  type: 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  userId: string;
  likes: string[];
  comments: Comment[];
}

export type CanvasElement = DrawPath | Note;

export interface User {
  id: string;
  username: string;
  color: string;
}

export interface CanvasState {
  elements: CanvasElement[];
  users: User[];
  selfId?: string;
  selfUsername?: string;
  selfColor?: string;
}

export type ToolType = 'brush' | 'eraser' | 'note' | 'image' | 'like' | 'comment';

export interface NotificationItem {
  id: string;
  type: 'userJoin' | 'userLeave' | 'like' | 'comment' | 'draw' | 'addNote';
  username: string;
  userColor: string;
  elementId?: string;
  text?: string;
  timestamp: number;
}
