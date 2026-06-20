export type CardTag = '人物' | '事件' | '地点' | '物品';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type ConnectionType = '关联' | '因果' | '时序' | '并列' | '对比';

export interface Card {
  id: string;
  title: string;
  content: string;
  tags: CardTag[];
  priority: Priority;
  position: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  createdAt: number;
}

export interface ProjectData {
  version: string;
  timestamp: number;
  cards: Card[];
  connections: Connection[];
}

export interface DragItem {
  type: 'CARD' | 'CONNECTION_START';
  id?: string;
  cardId?: string;
}

export const TAG_COLORS: Record<CardTag, string> = {
  '人物': '#e74c3c',
  '事件': '#3498db',
  '地点': '#2ecc71',
  '物品': '#f39c12',
};

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  '关联': '#888888',
  '因果': '#ff6b6b',
  '时序': '#4dabf7',
  '并列': '#51cf66',
  '对比': '#cc5de8',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  'P0': '#ff4757',
  'P1': '#ffa502',
  'P2': '#70a1ff',
  'P3': '#a4b0be',
};

export const CONNECTION_TYPES: ConnectionType[] = ['关联', '因果', '时序', '并列', '对比'];
export const CARD_TAGS: CardTag[] = ['人物', '事件', '地点', '物品'];
export const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];
