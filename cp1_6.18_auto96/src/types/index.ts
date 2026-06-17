export type NodeType = 'scene' | 'character' | 'event' | 'setting';

export interface BoardNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  tags: string[];
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  createdAt: string;
}

export type ActionType =
  | 'create_node'
  | 'delete_node'
  | 'update_node'
  | 'create_connection'
  | 'delete_connection'
  | 'update_connection'
  | 'move_node';

export interface Snapshot {
  id: string;
  timestamp: string;
  actionType: ActionType;
  nodes: BoardNode[];
  connections: Connection[];
}

export interface BoardState {
  nodes: BoardNode[];
  connections: Connection[];
  snapshots: Snapshot[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  isReverting: boolean;
}

export interface BoardActions {
  takeSnapshot: (actionType: ActionType) => void;
  addNode: (node: Omit<BoardNode, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<BoardNode>) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  addConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => void;
  deleteConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  revertToSnapshot: (snapshotId: string) => void;
  selectNode: (nodeId: string | null) => void;
  selectConnection: (connectionId: string | null) => void;
}

export const NodeTypeColors: Record<NodeType, string> = {
  scene: '#4ECDC4',
  character: '#FFE66D',
  event: '#FF6B6B',
  setting: '#A29BFE',
};

export const NodeTypeLabels: Record<NodeType, string> = {
  scene: '场景',
  character: '角色',
  event: '事件',
  setting: '设定',
};

export const ActionTypeIcons: Record<ActionType, string> = {
  create_node: 'Plus',
  delete_node: 'Trash2',
  update_node: 'Edit3',
  create_connection: 'Link',
  delete_connection: 'Unlink',
  update_connection: 'Link2',
  move_node: 'Move',
};

export const ActionTypeLabels: Record<ActionType, string> = {
  create_node: '创建节点',
  delete_node: '删除节点',
  update_node: '更新节点',
  create_connection: '创建连接',
  delete_connection: '删除连接',
  update_connection: '更新连接',
  move_node: '移动节点',
};
