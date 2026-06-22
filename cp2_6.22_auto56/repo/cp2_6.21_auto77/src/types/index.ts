export interface BrainstormNode {
  id: string;
  roomId: string;
  title: string;
  note: string;
  tags: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  roomId: string;
  fromNodeId: string;
  toNodeId: string;
  createdAt: string;
}

export interface SemanticGroup {
  id: string;
  roomId: string;
  keyword: string;
  nodeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  cursorX?: number;
  cursorY?: number;
}

export interface RoomState {
  nodes: BrainstormNode[];
  connections: Connection[];
  groups: SemanticGroup[];
  users: User[];
}

export interface CreateNodeParams {
  id?: string;
  roomId: string;
  title: string;
  note?: string;
  tags?: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  groupId?: string;
}

export interface UpdateNodeParams {
  id: string;
  title?: string;
  note?: string;
  tags?: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  groupId?: string;
}

export interface MoveNodeParams {
  id: string;
  x: number;
  y: number;
}

export interface CreateConnectionParams {
  id?: string;
  roomId: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface UpdateGroupParams {
  id: string;
  keyword?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SemanticNodeInput {
  id: string;
  title: string;
}

export interface SemanticGroupResult {
  keyword: string;
  nodeIds: string[];
}

export interface SemanticSimilarityResult {
  node1: string;
  node2: string;
  similarity: number;
}

export interface RoomInfo {
  roomId: string;
  roomName: string;
}

export type SocketEventType =
  | 'roomState'
  | 'nodeUpdate'
  | 'nodeDelete'
  | 'connectionUpdate'
  | 'connectionDelete'
  | 'groupUpdate'
  | 'userJoin'
  | 'userLeave'
  | 'cursorUpdate'
  | 'roomReset';

export interface SocketMessage {
  type: SocketEventType | string;
  [key: string]: any;
}
