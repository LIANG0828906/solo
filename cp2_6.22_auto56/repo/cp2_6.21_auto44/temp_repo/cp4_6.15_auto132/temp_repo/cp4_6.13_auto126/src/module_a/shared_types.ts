export type ToolType = 'raise' | 'lower';

export interface BrushParams {
  type: ToolType;
  radius: number;
  strength: number;
}

export interface HeightData {
  size: number;
  heights: Float32Array;
}

export interface BrushPosition {
  worldX: number;
  worldZ: number;
  visible: boolean;
}
