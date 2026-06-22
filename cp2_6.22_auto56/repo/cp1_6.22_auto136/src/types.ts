export interface TaskCard {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  cardIds: string[];
}

export interface BoardData {
  columns: BoardColumn[];
  columnOrder: string[];
  cards: Record<string, TaskCard>;
}

export type WSMessageType =
  | 'BOARD_UPDATED'
  | 'COLUMN_CREATED'
  | 'COLUMN_RENAMED'
  | 'CARD_CREATED'
  | 'CARD_UPDATED'
  | 'CARD_DELETED'
  | 'CARDS_REORDERED'
  | 'USER_CONNECTED'
  | 'USER_DISCONNECTED'
  | 'SYNC_STATE';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: number;
  senderId?: string;
}

export interface OnlineUser {
  id: string;
  connectedAt: number;
}
