import { v4 as uuidv4 } from 'uuid';
import type { WebSocket as WSWebSocket } from 'ws';

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

export interface ServerUser extends User {
  ws: WSWebSocket | null;
}

export interface CanvasState {
  elements: CanvasElement[];
  users: User[];
}

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
  '#00b894', '#e17055', '#74b9ff', '#6c5ce7'
];

const ANIMALS = [
  '海豚', '熊猫', '老虎', '狮子', '狐狸', '兔子',
  '猫头鹰', '企鹅', '考拉', '长颈鹿', '大象', '鲸鱼'
];

export function generateAnonymousUser(): { username: string; color: string } {
  const colorName = [
    '红色', '青色', '蓝色', '绿色',
    '黄色', '灰色', '粉色', '紫色',
    '碧绿', '橙色', '天蓝', '深紫'
  ];
  const colorIndex = Math.floor(Math.random() * COLORS.length);
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return {
    username: colorName[colorIndex] + animal,
    color: COLORS[colorIndex]
  };
}

export class CanvasManager {
  private elements: Map<string, CanvasElement> = new Map();
  private users: Map<string, ServerUser> = new Map();
  private broadcastQueue: any[] = [];
  private broadcastTimer: NodeJS.Timeout | null = null;
  private maxBroadcastPerSecond = 30;
  private broadcastInterval = 1000 / 30;

  getState(): CanvasState {
    return {
      elements: Array.from(this.elements.values()),
      users: Array.from(this.users.values()).map(({ ws: _ws, ...user }) => user)
    };
  }

  getElements(): CanvasElement[] {
    return Array.from(this.elements.values());
  }

  getUsers(): User[] {
    return Array.from(this.users.values()).map(({ ws: _ws, ...user }) => user);
  }

  addUser(user: ServerUser): void {
    this.users.set(user.id, user);
    this.queueBroadcast({
      type: 'userJoin',
      data: { id: user.id, username: user.username, color: user.color }
    });
  }

  removeUser(userId: string): void {
    this.users.delete(userId);
    this.queueBroadcast({
      type: 'userLeave',
      data: { userId }
    });
  }

  addElement(element: CanvasElement): void {
    this.elements.set(element.id, element);
    this.queueBroadcast({
      type: element.type === 'path' ? 'draw' : 'addNote',
      data: element
    });
  }

  updateElement(id: string, updates: Partial<CanvasElement>): CanvasElement | null {
    const element = this.elements.get(id);
    if (!element) return null;
    const updated = { ...element, ...updates } as CanvasElement;
    this.elements.set(id, updated);
    this.queueBroadcast({
      type: 'updateNote',
      data: updated
    });
    return updated;
  }

  likeElement(elementId: string, userId: string): { elementId: string; userId: string; count: number; liked: boolean } | null {
    const element = this.elements.get(elementId);
    if (!element) return null;

    const likeIndex = element.likes.indexOf(userId);
    let liked: boolean;

    if (likeIndex === -1) {
      element.likes.push(userId);
      liked = true;
    } else {
      element.likes.splice(likeIndex, 1);
      liked = false;
    }

    this.queueBroadcast({
      type: 'like',
      data: { elementId, userId, count: element.likes.length, liked }
    });

    return { elementId, userId, count: element.likes.length, liked };
  }

  addComment(elementId: string, userId: string, username: string, text: string): Comment | null {
    const element = this.elements.get(elementId);
    if (!element) return null;

    const comment: Comment = {
      id: uuidv4(),
      userId,
      username,
      text,
      timestamp: Date.now()
    };

    element.comments.push(comment);

    this.queueBroadcast({
      type: 'comment',
      data: { elementId, comment }
    });

    return comment;
  }

  private queueBroadcast(message: any): void {
    this.broadcastQueue.push(message);

    if (!this.broadcastTimer) {
      this.broadcastTimer = setTimeout(() => this.flushBroadcast(), this.broadcastInterval);
    }
  }

  private flushBroadcast(): void {
    if (this.broadcastQueue.length === 0) {
      this.broadcastTimer = null;
      return;
    }

    const messages = [...this.broadcastQueue];
    this.broadcastQueue = [];

    let payload: any;
    if (messages.length === 1) {
      payload = messages[0];
    } else {
      payload = { type: 'batch', data: messages };
    }

    const payloadStr = JSON.stringify(payload);

    for (const user of this.users.values()) {
      if (user.ws && user.ws.readyState === 1) {
        try {
          user.ws.send(payloadStr);
        } catch (e) {
          console.error('Failed to send message to user', user.id, e);
        }
      }
    }

    this.broadcastTimer = setTimeout(() => this.flushBroadcast(), this.broadcastInterval);
  }

  sendToUser(userId: string, message: any): void {
    const user = this.users.get(userId);
    if (user?.ws && user.ws.readyState === 1) {
      user.ws.send(JSON.stringify(message));
    }
  }

  broadcastDirect(message: any): void {
    this.queueBroadcast(message);
  }
}

export const canvasManager = new CanvasManager();
