export type CardType = 'image' | 'text' | 'link';

export interface Position {
  x: number;
  y: number;
}

export interface CardSize {
  width: number;
  height: number;
}

export interface ImageCardContent {
  imageUrl: string;
  imageName?: string;
}

export interface TextCardContent {
  text: string;
}

export interface LinkCardContent {
  title: string;
  url: string;
}

export interface Card {
  id: string;
  type: CardType;
  position: Position;
  size: CardSize;
  zIndex: number;
  content: ImageCardContent | TextCardContent | LinkCardContent;
}

export interface Board {
  id: string;
  userId: string;
  title: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}

export interface SaveBoardRequest {
  id?: string;
  userId: string;
  title: string;
  cards: Card[];
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  cardId: string | null;
}
