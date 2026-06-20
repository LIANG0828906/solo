export type BlockType = 'cube' | 'sphere' | 'prism';

export interface Block {
  id: string;
  type: BlockType;
  position: [number, number, number];
  color: string;
  velocity?: [number, number, number];
  isCollapsed?: boolean;
}

export interface CenterOfMass {
  position: [number, number, number];
  offsetPercent: number;
  isOutOfBounds: boolean;
  totalMass: number;
  supportRadius: number;
}

export interface FragmentData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  size: number;
  color: string;
}

export interface CollapseResult {
  shouldCollapse: boolean;
  fragments: FragmentData[];
  blockVelocities: { id: string; velocity: [number, number, number] }[];
  centerOfMass: CenterOfMass;
}

export interface HistoryState {
  blocks: Block[];
  timestamp: number;
}

export const COLORS = [
  '#E67E22',
  '#3498DB',
  '#2ECC71',
  '#E74C3C',
  '#9B59B6',
  '#1ABC9C',
  '#F39C12',
  '#34495E',
  '#E91E63',
  '#00BCD4',
  '#8BC34A',
  '#FF5722',
];

export const GRID_STEP = 0.5;

export const GRAVITY = -9.8;

export const RESTITUTION = 0.2;

export const MAX_FRAGMENTS = 5000;

export const MAX_HISTORY = 20;

export const COLLAPSE_THRESHOLD = 0.1;
