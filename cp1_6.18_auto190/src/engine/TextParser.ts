export interface ParticleInitData {
  id: string;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
  charIndex: number;
  floatOffset: number;
  floatFrequency: number;
  expandedX: number;
  expandedY: number;
  expandedZ: number;
}

export interface CharCloudInitData {
  index: number;
  character: string;
  strokeCount: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}
