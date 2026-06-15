export interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

export interface Vote {
  id: string;
  cardId: string;
  userId: string;
  value: 1 | -1;
  timestamp: number;
}

export interface Card {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  sketchData?: string;
  position: number;
  createdAt: number;
  votes: Vote[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inviteCode: string;
  hostId: string;
  hostName: string;
  participants: Participant[];
  cards: Card[];
  isVoting: boolean;
  createdAt: number;
}

export interface RoomListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inviteCode: string;
  hostName: string;
  participantCount: number;
  cardCount: number;
  isVoting: boolean;
  createdAt: number;
}

export type WSMessageType =
  | 'CARD_CREATE'
  | 'CARD_MOVE'
  | 'VOTE_CAST'
  | 'VOTING_START'
  | 'VOTING_END'
  | 'SYNC_STATE';

export interface WSMessage {
  type: WSMessageType;
  roomId: string;
  payload?: unknown;
  timestamp: number;
}

export interface CreateCardPayload {
  roomId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  sketchData?: string;
  position: number;
}

export interface MoveCardPayload {
  cardId: string;
  position: number;
}

export type CanvasTool = 'pen' | 'line' | 'circle' | 'eraser';

export interface UserInfo {
  id: string;
  name: string;
}
