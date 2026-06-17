export interface Idea {
  id: string;
  text: string;
  clusterId: string | null;
  x: number;
  y: number;
  radius: number;
  color: string;
  createdAt: number;
  vector: number[];
}

export interface Cluster {
  id: string;
  name: string;
  color: string;
  center: [number, number];
  ideaIds: string[];
}

export interface StarPosition {
  x: number;
  y: number;
}

export interface ClusterResult {
  clusters: Cluster[];
  ideas: Idea[];
}

export interface CanvasStar {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  clusterId: string | null;
  text: string;
  isAnimating: boolean;
  animationStartTime: number;
}

export interface BackgroundParticle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  phase: number;
  period: number;
}

export interface DragTrail {
  x: number;
  y: number;
  timestamp: number;
}

export interface StarConnection {
  fromId: string;
  toId: string;
  strength: number;
}

export const THEME_COLORS: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#FF69B4', '#00CED1', '#9370DB', '#20B2AA',
  '#FF7F50', '#87CEEB', '#DDA0DD', '#90EE90', '#FFD700'
];

export const EASING_FUNCTION = (t: number): number => {
  return cubicBezier(0.25, 0.1, 0.25, 1, t);
};

function cubicBezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  
  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleCurveDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  
  const solveCurveX = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t) - x;
      if (Math.abs(x2) < 1e-6) return t;
      const d2 = sampleCurveDerivativeX(t);
      if (Math.abs(d2) < 1e-6) break;
      t -= x2 / d2;
    }
    return t;
  };
  
  return sampleCurveY(solveCurveX(t));
}
