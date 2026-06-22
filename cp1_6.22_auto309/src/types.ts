export interface StrokePoint {
  x: number;
  y: number;
  timestamp: number;
  speed: number;
}

export interface ScoreDimension {
  score: number;
  label: string;
}

export interface DeviationMarker {
  x: number;
  y: number;
  angleDiff: number;
  createdAt: number;
}

export interface StylePreset {
  id: string;
  name: string;
  referencePath: StrokePoint[];
  sampleOutline: string;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  totalScore: number;
  smoothness: ScoreDimension;
  structure: ScoreDimension;
  pressure: ScoreDimension;
  styleId: string;
  styleName: string;
  timestamp: number;
  deviationMarkers: DeviationMarker[];
}

export interface DryingStroke {
  id: string;
  points: StrokePoint[];
  startDryingTime: number;
  duration: number;
}

export type ReplayState = {
  isPlaying: boolean;
  stroke: Stroke | null;
  progress: number;
  startTime: number;
  duration: number;
};

const generateReferencePath = (): StrokePoint[] => {
  const points: StrokePoint[] = [];
  const t0 = Date.now();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = 120 + t * 360;
    const y = 300 + Math.sin(t * Math.PI * 2) * 40 - t * 20;
    points.push({
      x,
      y,
      timestamp: t0 + i * 16,
      speed: 2 + Math.sin(t * Math.PI) * 1.5,
    });
  }
  return points;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'kaishu',
    name: '楷体',
    referencePath: generateReferencePath(),
    sampleOutline:
      'M 20 40 Q 60 35 100 45 T 180 40 L 185 52 Q 120 60 60 58 T 20 52 Z',
  },
  {
    id: 'xingshu',
    name: '行书',
    referencePath: generateReferencePath(),
    sampleOutline:
      'M 18 42 Q 50 30 100 38 T 175 45 Q 180 55 140 58 Q 80 60 25 55 Q 16 48 18 42 Z',
  },
  {
    id: 'caoshu',
    name: '草书',
    referencePath: generateReferencePath(),
    sampleOutline:
      'M 22 48 Q 45 28 90 42 T 160 40 Q 185 48 165 58 Q 110 62 50 56 Q 20 52 22 48 Z',
  },
  {
    id: 'lishu',
    name: '隶书',
    referencePath: generateReferencePath(),
    sampleOutline:
      'M 20 42 L 80 38 L 180 42 L 178 58 L 120 62 L 22 58 Z',
  },
  {
    id: 'zhuanshu',
    name: '篆体',
    referencePath: generateReferencePath(),
    sampleOutline:
      'M 25 45 Q 25 35 60 37 Q 120 35 160 38 Q 175 42 175 50 Q 172 60 130 60 Q 70 62 28 58 Q 22 52 25 45 Z',
  },
];
