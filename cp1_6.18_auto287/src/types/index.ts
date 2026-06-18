export type CardType = 'character' | 'scene' | 'event' | 'object';

export interface StoryCard {
  id: string;
  type: CardType;
  name: string;
  description: string;
  x?: number;
  y?: number;
  placedInEditor?: boolean;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface GameState {
  cards: StoryCard[];
  connections: Connection[];
  storyText: string;
  isDragging: boolean;
  selectedCardId: string | null;
  connectingFromId: string | null;
}

export interface DragItem {
  type: 'CARD';
  card: StoryCard;
}
