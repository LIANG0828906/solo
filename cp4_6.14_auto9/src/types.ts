export type Priority = 'high' | 'medium' | 'low';

export type CardStatus = string;

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: Priority;
  dueDate: string;
  status: CardStatus;
  lastEditor: string;
  lastEditorAvatar: string;
  lastEditTime: number;
}

export interface Lane {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface Board {
  id: string;
  title: string;
  lanes: Lane[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export type WSMessageType =
  | 'card:add'
  | 'card:update'
  | 'card:move'
  | 'board:init'
  | 'user:join'
  | 'board:addLane'
  | 'board:removeLane'
  | 'board:updateLaneTitle';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  senderId: string;
  timestamp: number;
}

export interface CardMovePayload {
  cardId: string;
  fromLaneId: string;
  toLaneId: string;
  newIndex: number;
  lastEditor: string;
  lastEditorAvatar: string;
}

export interface CardAddPayload {
  card: KanbanCard;
  laneId: string;
}

export interface CardUpdatePayload {
  card: KanbanCard;
  laneId: string;
}
