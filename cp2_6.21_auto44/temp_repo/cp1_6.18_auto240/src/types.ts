export interface IdeaNode {
  id: string;
  title: string;
  description: string;
  color: string;
  tags: string[];
  x: number;
  y: number;
  connectedIds: string[];
  createdAt: string;
  updatedAt: string;
  isGroup?: boolean;
  groupNodeIds?: string[];
  isCollapsed?: boolean;
  parentGroupId?: string;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface EditingState {
  nodeId: string | null;
  userId: string;
}

export const NODE_COLORS = [
  '#7B2D8E',
  '#FF6B6B',
  '#1ABC9C',
  '#FFD93D',
  '#4FC3F7',
  '#E67E22',
  '#9B59B6',
  '#2ECC71'
];

export const NODE_RADIUS = 30;
export const MAGNETIC_DISTANCE = 80;
