export type NodeType = 'goal' | 'subtask' | 'milestone';
export type NodeStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface TimelineNode {
  id: string;
  type: NodeType;
  description: string;
  status: NodeStatus;
  estimatedDays: number;
  parentId: string | null;
  branchId: string;
  createdAt: number;
  dayOffset: number;
}

export interface Branch {
  id: string;
  parentNodeId: string;
}

export interface FilterState {
  typeFilter: NodeType | null;
  statusFilter: NodeStatus | null;
  keyword: string;
}

export interface TimeConfig {
  startDate: number;
  zoomLevel: number;
  offsetX: number;
}

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  node: TimelineNode;
  filtered: boolean;
}

export interface BranchPath {
  branchId: string;
  points: { x: number; y: number }[];
  color: string;
}

export interface LayoutResult {
  nodes: NodeLayout[];
  branches: BranchPath[];
  axisY: number;
  axisStartX: number;
  axisEndX: number;
  endDate: Date | null;
}

export const NODE_COLORS: Record<NodeType, string> = {
  goal: '#4ECDC4',
  subtask: '#FFE66D',
  milestone: '#FF6B6B',
};

export const STATUS_CYCLE: NodeStatus[] = [
  'not_started',
  'in_progress',
  'completed',
  'overdue',
];

export const BRANCH_COLOR = '#6C63FF';
export const BG_PRIMARY = '#1A1A2E';
export const BG_SECONDARY = '#2D2D44';
export const BG_INPUT = '#1E1E2E';
export const BORDER_COLOR = '#3A3A5C';
export const SLIDER_TRACK = '#4A4A6A';
export const SLIDER_THUMB = '#6BCB77';
export const EXPORT_BTN = '#6C63FF';
export const IMPORT_BTN = '#FF6B6B';
