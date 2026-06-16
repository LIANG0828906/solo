export type CanvasTool = 'brush' | 'sticker' | 'text';

export type StickerType =
  | 'sun' | 'star' | 'smile' | 'flag' | 'heart' | 'rocket' | 'coffee' | 'music'
  | 'thumbs_up' | 'fire' | 'sparkles' | 'idea';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface BrushStroke {
  type: 'brush';
  id: string;
  points: Point[];
  color: string;
  lineWidth: number;
  opacity: number;
  userId: string;
  userName: string;
  timestamp: number;
  associatedOptionId?: string;
}

export interface StickerItem {
  type: 'sticker';
  id: string;
  stickerType: StickerType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  userId: string;
  userName: string;
  timestamp: number;
  associatedOptionId?: string;
}

export interface TextBubble {
  type: 'text';
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bgColor: string;
  userId: string;
  userName: string;
  timestamp: number;
  associatedOptionId?: string;
}

export type CanvasAction = BrushStroke | StickerItem | TextBubble;

export interface Collaborator {
  userId: string;
  userName: string;
  cursorX: number;
  cursorY: number;
  color: string;
  lastActive: number;
  selectedTool: CanvasTool;
}

export interface CanvasSnapshot {
  actions: CanvasAction[];
  version: number;
  voteInviteCode: string;
}

export const STICKER_PRESETS: StickerType[] = [
  'sun', 'star', 'smile', 'flag', 'heart', 'rocket',
  'coffee', 'music', 'thumbs_up', 'fire', 'sparkles', 'idea'
];
