export interface AvatarCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NodeData {
  id: string;
  name: string;
  photoUrl?: string;
  avatarCrop?: AvatarCrop;
  generation: number;
  isCollapsed: boolean;
  parentIds: string[];
  childrenIds: string[];
}

export type RelationType = 'blood' | 'marriage';

export interface RelationData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: RelationType;
  label?: string;
}

export interface LayoutNode extends NodeData {
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  collapsedDescendantCount?: number;
  targetX?: number;
  targetY?: number;
}

export interface LayoutRelation {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: RelationType;
  label?: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface Collaborator {
  id: string;
  username: string;
  color: string;
  cursorX: number;
  cursorY: number;
}

export type ToolMode = 'select' | 'connect' | 'mark' | 'pan';

export interface MarkingRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ConnectingState {
  fromNodeId: string | null;
  tempEndX: number;
  tempEndY: number;
}

export type HistoryAction =
  | { type: 'ADD_NODE'; node: NodeData }
  | { type: 'REMOVE_NODE'; node: NodeData; relations: RelationData[] }
  | { type: 'UPDATE_NODE'; id: string; prev: Partial<NodeData>; next: Partial<NodeData> }
  | { type: 'ADD_RELATION'; relation: RelationData }
  | { type: 'REMOVE_RELATION'; relation: RelationData };

export interface FamilyTreeStats {
  totalMembers: number;
  generations: number;
}

export interface ShareInfo {
  shareUrl: string;
  stats: FamilyTreeStats;
}

export interface FamilyTreeExport {
  version: string;
  exportedAt: string;
  name: string;
  nodes: NodeData[];
  relations: RelationData[];
  stats: FamilyTreeStats;
}
