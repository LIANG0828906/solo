export interface MindMapNode {
  id: string;
  text: string;
  children: MindMapNode[];
  x: number;
  y: number;
  color: string;
  parentId: string | null;
  level: number;
}

export interface UserInfo {
  id: string;
  nickname: string;
  color: string;
}

export type NodeEventType = 'create' | 'update' | 'delete' | 'drag' | 'text_update';

export interface NodeEventMessage {
  type: NodeEventType;
  nodeId: string;
  node?: MindMapNode;
  x?: number;
  y?: number;
  text?: string;
  parentId?: string;
}

export interface WSMessage {
  type: string;
  data: any;
}
