export type FlourType = 'fine' | 'medium' | 'bran';

export type QualityGrade = 'S' | 'A' | 'B' | 'C';

export interface SiftingResult {
  fine: number;
  medium: number;
  bran: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  flourType: FlourType;
  productionDate: string;
  weight: number;
  qualityGrade: QualityGrade;
  millGap: number;
  waterValve: number;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
