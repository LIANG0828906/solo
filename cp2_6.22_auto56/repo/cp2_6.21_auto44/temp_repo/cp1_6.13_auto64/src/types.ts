export type CardType = 'rectangle' | 'circle' | 'star';

export interface Card {
  id: string;
  type: CardType;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  hue: number;
  children: Card[];
  collapsed: boolean;
  label: string;
  parentId: string | null;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface AppState {
  cards: Card[];
  selectedCardId: string | null;
  lastClickedCardId: string | null;
  canvas: CanvasState;
  history: Card[][];
  historyIndex: number;
}
