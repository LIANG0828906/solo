export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  roomId: string;
  joinedAt: number;
  lastActive: number;
}

export interface Highlight {
  id: string;
  roomId: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  userId: string;
  color: string;
  annotation?: string;
  createdAt: number;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  highlightId?: string;
  paragraphIndex?: number;
  createdAt: number;
}

export interface Room {
  id: string;
  name: string;
  bookName: string;
  createdAt: number;
  lastActive: number;
  createdBy: string;
}

export type SyncAction =
  | { type: 'user_join'; payload: User; timestamp: number }
  | { type: 'user_leave'; payload: { userId: string; roomId: string }; timestamp: number }
  | { type: 'add_highlight'; payload: Highlight; timestamp: number }
  | { type: 'update_highlight'; payload: Highlight; timestamp: number }
  | { type: 'send_message'; payload: Message; timestamp: number }
  | { type: 'ping'; payload: { userId: string; roomId: string }; timestamp: number };

export interface AppState {
  currentRoom: Room | null;
  currentUser: User | null;
  rooms: Room[];
  users: User[];
  highlights: Highlight[];
  messages: Message[];
  selectedHighlightId: string | null;
  blinkParagraphIndex: number | null;
}
