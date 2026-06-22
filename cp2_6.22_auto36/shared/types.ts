export type CardColor =
  | 'coral'
  | 'amber'
  | 'lemon'
  | 'mint'
  | 'sky'
  | 'lavender'
  | 'rose'
  | 'slate';

export interface Card {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  color: CardColor;
  x: number;
  y: number;
  width: number;
  creatorId: string;
  createdAt: number;
}

export interface Vote {
  cardId: string;
  userId: string;
}

export interface BoardState {
  cards: Card[];
  votes: Vote[];
  userId: string;
}

export type ClientEvent =
  | { type: 'ADD_CARD'; payload: Omit<Card, 'id' | 'creatorId' | 'createdAt'> }
  | { type: 'MOVE_CARD'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_CARD'; payload: Partial<Card> & { id: string } }
  | { type: 'DELETE_CARD'; payload: { id: string } }
  | { type: 'TOGGLE_VOTE'; payload: { cardId: string } };

export type ServerEvent =
  | { type: 'INIT_STATE'; payload: BoardState }
  | { type: 'CARD_ADDED'; payload: Card }
  | { type: 'CARD_MOVED'; payload: { id: string; x: number; y: number } }
  | { type: 'CARD_UPDATED'; payload: Card }
  | { type: 'CARD_DELETED'; payload: { id: string } }
  | {
      type: 'VOTE_TOGGLED';
      payload: { cardId: string; userId: string; voted: boolean; total: number };
    }
  | { type: 'ERROR'; payload: { message: string } };

export const CARD_COLORS: Record<CardColor, string> = {
  coral: '#FF6B6B',
  amber: '#FFA94D',
  lemon: '#FFE066',
  mint: '#69DB7C',
  sky: '#74C0FC',
  lavender: '#B197FC',
  rose: '#F783AC',
  slate: '#868E96',
};

export const CARD_COLOR_LIST: CardColor[] = [
  'coral',
  'amber',
  'lemon',
  'mint',
  'sky',
  'lavender',
  'rose',
  'slate',
];
