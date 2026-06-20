export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  note?: string;
  icon?: string;
}

export interface User {
  id: string;
  name: string;
  socketId: string;
  roomCode: string;
}

export type NodeMap = Map<string, MindMapNode>;

export interface ParseResult {
  nodes: NodeMap;
  rootId: string;
}
