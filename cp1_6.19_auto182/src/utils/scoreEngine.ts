export interface Waypoint {
  lat: number;
  lng: number;
}

export interface SegmentData {
  slope: number;
  treeCoverage: number;
  surfaceQuality: number;
  trafficVolume: number;
}

export interface ScoreWeights {
  slope: number;
  treeCoverage: number;
  surfaceQuality: number;
  trafficVolume: number;
}

export interface CommentData {
  id: string;
  text: string;
  createdAt: string;
}

export interface RouteData {
  id: string;
  name: string;
  waypoints: Waypoint[];
  segments: SegmentData[];
  distance: number;
  elevationGain: number;
  likes: number;
  liked: boolean;
  comments: CommentData[];
  scores: number[];
  createdAt: string;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  slope: 25,
  treeCoverage: 25,
  surfaceQuality: 25,
  trafficVolume: 25,
};

export function calculateScores(
  segments: SegmentData[],
  weights: ScoreWeights
): number[] {
  const totalWeight =
    weights.slope + weights.treeCoverage + weights.surfaceQuality + weights.trafficVolume;
  if (totalWeight === 0) return segments.map(() => 50);

  return segments.map((seg) => {
    const slopeScore = 100 - Math.min(100, Math.max(0, seg.slope));
    const treeScore = Math.min(100, Math.max(0, seg.treeCoverage));
    const surfaceScore = Math.min(100, Math.max(0, seg.surfaceQuality));
    const trafficScore = 100 - Math.min(100, Math.max(0, seg.trafficVolume));

    const weightedSum =
      slopeScore * weights.slope +
      treeScore * weights.treeCoverage +
      surfaceScore * weights.surfaceQuality +
      trafficScore * weights.trafficVolume;

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  });
}

export function scoreToColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100));
  const r = Math.round(229 + (67 - 229) * t);
  const g = Math.round(57 + (160 - 57) * t);
  const b = Math.round(53 + (71 - 53) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
