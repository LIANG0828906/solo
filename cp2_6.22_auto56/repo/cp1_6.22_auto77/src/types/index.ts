export interface MindMapNode {
  id: string;
  parentId: string | null;
  text: string;
  colorTag: string;
  level: number;
  order: number;
  collapsed: boolean;
  childrenIds: string[];
}

export interface Note {
  id: string;
  nodeId: string;
  content: string;
  order: number;
  createdAt: number;
}

export interface MindMapData {
  rootId: string;
  nodes: Record<string, MindMapNode>;
  notes: Record<string, Note[]>;
}

export interface OnlineUser {
  userId: string;
  name: string;
  avatarColor: string;
}

export type ClientMessage =
  | { type: 'JOIN'; userId: string; userName: string }
  | { type: 'UPDATE_NODE'; nodeId: string; patch: Partial<MindMapNode> }
  | { type: 'ADD_NODE'; parentId: string; newNode: MindMapNode }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'MOVE_NODE'; nodeId: string; newParentId: string; index: number }
  | { type: 'ADD_NOTE'; nodeId: string; note: Note }
  | { type: 'UPDATE_NOTE'; nodeId: string; noteId: string; content: string }
  | { type: 'DELETE_NOTE'; nodeId: string; noteId: string }
  | { type: 'REORDER_NOTES'; nodeId: string; noteIds: string[] };

export type ServerMessage =
  | { type: 'INIT'; data: MindMapData; users: OnlineUser[] }
  | { type: 'USER_JOIN'; user: OnlineUser }
  | { type: 'USER_LEAVE'; userId: string }
  | ClientMessage;

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}
