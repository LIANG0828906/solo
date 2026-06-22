export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export type CardType = 'text' | 'image' | 'todo';

export interface Card {
  id: number;
  type: CardType;
  title: string;
  content: string;
  color: string | null;
  x: number;
  y: number;
  z_index: number;
  created_at: string;
  updated_at: string;
}

export interface CardCreate {
  type: CardType;
  title: string;
  content: string;
  color: string | null;
  x: number;
  y: number;
  z_index: number;
}

export interface CardUpdate {
  type?: CardType;
  title?: string;
  content?: string;
  color?: string | null;
  x?: number;
  y?: number;
  z_index?: number;
}

export interface HistoryAction {
  type: 'add' | 'delete' | 'move' | 'edit';
  previousState: Card[];
  timestamp: number;
}
