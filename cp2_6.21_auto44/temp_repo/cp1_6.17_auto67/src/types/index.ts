export interface ComponentConfig {
  type: 'Button' | 'Card' | 'Input';
  props: Record<string, unknown>;
  children?: ComponentConfig[];
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  avgColorDiff: number;
}

export interface DiffResult {
  totalDiffPixels: number;
  totalPixels: number;
  diffPercent: number;
  diffRegions: DiffRegion[];
  diffImageDataURL?: string;
}

export interface VersionSnapshot {
  id: string;
  label: 'A' | 'B';
  config: ComponentConfig;
  thumbnail: string;
  createdAt: number;
}
