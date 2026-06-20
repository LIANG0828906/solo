export type PipelineType = 'water' | 'power' | 'communication' | 'gas';

export interface PipelinePoint {
  x: number;
  y: number;
  z: number;
}

export interface Pipeline {
  id: string;
  type: PipelineType;
  diameter: number;
  start: PipelinePoint;
  end: PipelinePoint;
}

export interface CollisionResult {
  id: string;
  pipelineAId: string;
  pipelineBId: string;
  point: PipelinePoint;
}

export const PIPELINE_COLORS: Record<PipelineType, string> = {
  water: '#2196F3',
  power: '#FFC107',
  communication: '#4CAF50',
  gas: '#F44336',
};

export const PIPELINE_LABELS: Record<PipelineType, string> = {
  water: '给排水',
  power: '电力',
  communication: '通信',
  gas: '燃气',
};

export const PIPELINE_ICONS: Record<PipelineType, string> = {
  water: '💧',
  power: '⚡',
  communication: '📡',
  gas: '🔥',
};

export const CORRIDOR_WIDTH = 3;
export const CORRIDOR_HEIGHT = 2;
export const CORRIDOR_DEPTH = 10;
