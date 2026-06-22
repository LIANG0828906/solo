export interface MindMapNode {
  id: string;
  title: string;
  subtitle?: string;
  parentId: string | null;
  children: string[];
  x: number;
  y: number;
  color: string;
  borderStyle: 'solid' | 'dashed' | 'double';
  fontSize: number;
  icon?: string;
}

export interface MindMap {
  rootId: string;
  nodes: Record<string, MindMapNode>;
}

export interface User {
  id: string;
  nickname: string;
  roomId: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
}

export interface RoomState {
  roomId: string;
  mindMap: MindMap;
  users: User[];
}

export type WSMessageType =
  | 'join_room'
  | 'leave_room'
  | 'room_state'
  | 'user_list'
  | 'node_add'
  | 'node_update'
  | 'node_delete'
  | 'node_move'
  | 'tree_update'
  | 'cursor_update'
  | 'history_undo'
  | 'history_redo';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  senderId?: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  timestamp: number;
  userId: string;
}

export const PRESET_COLORS = [
  '#ffffff', '#ff6b6b', '#ffa94d', '#ffd43b',
  '#a9e34b', '#69db7c', '#38d9a9', '#4dabf7',
  '#748ffc', '#9775fa', '#e599f7', '#f783ac'
];

export const EMOJI_ICONS = [
  '📌', '⭐', '💡', '🎯', '📝', '✅', '❌', '🔥',
  '❤️', '💎', '🎨', '📊', '💼', '🏠', '🚀', '⚡',
  '🌱', '🎵', '📚', '🔧', '💬', '👤', '👥', '🏆'
];
