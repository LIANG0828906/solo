
export interface Card {
  id: string;
  title: string;
  content: string;
  color: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardContextType {
  cards: Card[];
  selectedCard: Card | null;
  timeLineStamp: number;
  timeLineMode: boolean;
  loading: boolean;
  
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCardPosition: (id: string, x: number, y: number) => void;
  updateCardContent: (id: string, data: Partial<Pick<Card, 'title' | 'content' | 'color'>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setSelectedCard: (card: Card | null) => void;
  setTimeLineStamp: (timestamp: number) => void;
  setTimeLineMode: (mode: boolean) => void;
  fetchCards: () => Promise<void>;
}

export const COLOR_PALETTE = [
  '#FFFFFF',
  '#FEE2E2',
  '#FED7AA',
  '#FEF08A',
  '#BBF7D0',
  '#A7F3D0',
  '#A5F3FC',
  '#BFDBFE',
  '#DDD6FE',
  '#F5D0FE',
  '#FBCFE8',
  '#E5E7EB',
];

export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 180;
export const CARD_GAP = 32;
export const CARDS_PER_ROW = 5;
