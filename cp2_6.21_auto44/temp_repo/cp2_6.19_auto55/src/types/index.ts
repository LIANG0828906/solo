export type LinkType = 'prerequisite' | 'subsequent' | 'related';
export type NodeStatus = 'pending' | 'in-progress' | 'completed';
export type PanelKey = 'nodes' | 'links' | 'path' | null;

export interface KnowledgeNode {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  content: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  progress: number;
  status: NodeStatus;
  createdAt: number;
  updatedAt: number;
  __animAppear?: number;
}

export interface KnowledgeLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  label: string;
  createdAt: number;
}

export interface LearningPath {
  id: string;
  name: string;
  nodeIds: string[];
  progress: number;
}

export interface CanvasViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
}

export interface NodeCreationPayload {
  title: string;
  summary: string;
  tags: string[];
  content: string;
}

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  prerequisite: '前置知识',
  subsequent: '后续知识',
  related: '相关概念',
};

export const LINK_TYPE_COLORS: Record<LinkType, string> = {
  prerequisite: '#4a9eff',
  subsequent: '#52c41a',
  related: '#faad14',
};

export const TAG_COLOR_PALETTE = [
  '#ffd6e0',
  '#d4f1d4',
  '#d0e8ff',
  '#fff1cc',
  '#e8d9ff',
  '#ffe0cc',
  '#ccf5f5',
  '#f0d9e8',
];

export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[idx];
}

export function nodeBackgroundColor(tags: string[]): string {
  if (!tags || tags.length === 0) return '#f8f9fa';
  return hashStringToColor(tags[0]);
}

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 140;
