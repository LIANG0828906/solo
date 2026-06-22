export interface Rating {
  ip: string;
  score: number;
  timestamp: number;
}

export interface Comment {
  id: string;
  content: string;
  anonymousId: number;
  color: string;
  timestamp: number;
}

export interface InspirationCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  ratings: Rating[];
  comments: Comment[];
  createdAt: number;
}

export interface PublicCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: number;
  comments: Comment[];
  hasRated: boolean;
}

export type WSMessageType =
  | 'CARD_CREATED'
  | 'RATING_UPDATED'
  | 'COMMENT_ADDED'
  | 'INIT_SYNC';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
}

export interface CardCreatedPayload {
  card: PublicCardData;
}

export interface RatingUpdatedPayload {
  cardId: string;
  averageRating: number;
  ratingCount: number;
}

export interface CommentAddedPayload {
  cardId: string;
  comment: Comment;
  commentCount: number;
}

export interface InitSyncPayload {
  cards: PublicCardData[];
}

export type FilterType = 'all' | 'highRating' | 'recent';
