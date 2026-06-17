export interface SkeletonConfig {
  jointColor: string;
  boneColor: string;
  highlightColor: string;
  jointRadius: number;
  boneRadius: number;
  density: number;
  thickness: number;
  showLabels: boolean;
  maxVertices: number;
  cameraFar: number;
  backgroundColor: string;
  gridColor: string;
  glowColor: string;
  glowOpacity: number;
}

export const defaultConfig: SkeletonConfig = {
  jointColor: '#F59E0B',
  boneColor: '#78716C',
  highlightColor: '#EF4444',
  jointRadius: 0.12,
  boneRadius: 0.05,
  density: 5,
  thickness: 1.0,
  showLabels: false,
  maxVertices: 20000,
  cameraFar: 50,
  backgroundColor: '#0D1117',
  gridColor: '#1F2937',
  glowColor: '#3B82F6',
  glowOpacity: 0.1,
};
