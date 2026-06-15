export type FlourType = 'mai' | 'gu' | 'za';

export type QualityGrade = 'top' | 'medium' | 'coarse';

export interface SiftingResult {
  top: number;
  medium: number;
  coarse: number;
}

export interface ProductionBatch {
  id: string;
  flourType: FlourType;
  startTime: number;
  endTime?: number;
  rotations: number;
  currentStage: 'milling' | 'sifting' | 'packaging' | 'completed';
  output: SiftingResult;
  qualityScore: number;
}

export interface MillingState {
  isRunning: boolean;
  rotationSpeed: number;
  waterLevel: number;
  currentBatch: ProductionBatch | null;
  batches: ProductionBatch[];
}

export type MillingAction =
  | { type: 'START_MILLING'; payload: { flourType: FlourType } }
  | { type: 'STOP_MILLING' }
  | { type: 'UPDATE_SPEED'; payload: number }
  | { type: 'UPDATE_WATER_LEVEL'; payload: number }
  | { type: 'COMPLETE_BATCH' }
  | { type: 'SIFT_BATCH'; payload: SiftingResult };
