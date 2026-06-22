export type LightSourceType = 'LED' | '钠灯' | '荧光灯';

export interface BlockData {
  id: number;
  name: string;
  pollutionIndex: number;
  lightIntensity: number;
  lightSourceType: LightSourceType;
  historyData: number[];
  positionX: number;
  positionZ: number;
}

export interface SceneConfig {
  gridSize: number;
  blockSpacing: number;
  blockSize: number;
  minHeight: number;
  maxHeight: number;
  colorLow: string;
  colorHigh: string;
}

export interface GlobalStats {
  averagePollution: number;
  highestBlockName: string;
}
