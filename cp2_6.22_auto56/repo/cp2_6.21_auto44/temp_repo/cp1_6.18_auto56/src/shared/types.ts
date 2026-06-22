export interface IdeaNode {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  votes: {
    up: number;
    down: number;
  };
  createdAt: number;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  createdAt: number;
}

export interface CreateNodeInput {
  title: string;
  content: string;
  x: number;
  y: number;
}

export interface UpdateNodeInput {
  id: string;
  title?: string;
  content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface VoteInput {
  nodeId: string;
  type: 'up' | 'down';
}

export interface TempConnection {
  fromId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export type SortType = 'time' | 'votes';
