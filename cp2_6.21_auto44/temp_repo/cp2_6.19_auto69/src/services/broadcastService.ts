import type { CanvasElement, User } from '../store/canvasStore';

export type BroadcastMessageType = 
  | 'elementAdded' 
  | 'elementUpdated' 
  | 'elementRemoved' 
  | 'userJoined' 
  | 'userLeft'
  | 'hello'
  | 'syncRequest'
  | 'syncResponse';

export interface BroadcastMessage {
  type: BroadcastMessageType;
  payload: unknown;
  senderId: string;
  timestamp: number;
}

export interface ElementAddedPayload {
  element: CanvasElement;
}

export interface ElementUpdatedPayload {
  id: string;
  updates: Partial<CanvasElement>;
}

export interface ElementRemovedPayload {
  id: string;
}

export interface UserJoinedPayload {
  user: User;
}

export interface UserLeftPayload {
  userId: string;
}

export interface SyncResponsePayload {
  elements: CanvasElement[];
  users: User[];
}

export interface IBroadcastService {
  send: (message: BroadcastMessage) => void;
  subscribe: (callback: (message: BroadcastMessage) => void) => () => void;
  disconnect: () => void;
  setUserId: (userId: string) => void;
}

class BroadcastService implements IBroadcastService {
  private channel: BroadcastChannel;
  private subscribers: Set<(message: BroadcastMessage) => void> = new Set();
  private currentUserId: string;

  constructor(channelName: string = 'whiteboard-sync') {
    this.channel = new BroadcastChannel(channelName);
    this.currentUserId = '';

    this.channel.onmessage = (event) => {
      const message = event.data as BroadcastMessage;
      if (message.senderId !== this.currentUserId) {
        this.subscribers.forEach((callback) => callback(message));
      }
    };
  }

  setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  send(message: BroadcastMessage): void {
    this.channel.postMessage(message);
  }

  subscribe(callback: (message: BroadcastMessage) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  disconnect(): void {
    this.channel.close();
    this.subscribers.clear();
  }
}

export const createBroadcastService = (channelName?: string): IBroadcastService => {
  return new BroadcastService(channelName);
};

export default BroadcastService;
