export interface RecipeCard {
  id: string;
  name: string;
  sourceUrl: string;
  coverImage: string;
  tags: string[];
  difficulty: number;
  notes: string;
  order: number;
  boardId: string;
}

export interface RecipeBoard {
  id: string;
  name: string;
  gradient: string;
  createdAt: number;
  cardOrder: string[];
}

export interface BoardData {
  board: RecipeBoard;
  cards: RecipeCard[];
}

export type WsAction =
  | { type: 'BOARD_CREATED'; board: RecipeBoard }
  | { type: 'BOARD_UPDATED'; board: RecipeBoard }
  | { type: 'BOARD_DELETED'; boardId: string }
  | { type: 'CARD_CREATED'; card: RecipeCard }
  | { type: 'CARD_UPDATED'; card: RecipeCard }
  | { type: 'CARD_DELETED'; cardId: string; boardId: string }
  | { type: 'CARD_MOVED'; cardId: string; fromBoardId: string; toBoardId: string; newOrder: string[] };
