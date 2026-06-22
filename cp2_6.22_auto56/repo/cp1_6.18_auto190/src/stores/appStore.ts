export interface Particle {
  id: string;
  x: number;
  y: number;
  z: number;
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

export interface CharCloud {
  index: number;
  character: string;
  strokeCount: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  isHovered: boolean;
  expandProgress: number;
}
