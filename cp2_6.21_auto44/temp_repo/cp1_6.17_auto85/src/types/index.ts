export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FrameData {
  frameIndex: number;
  timestamp: number;
  landmarks: Landmark[];
}

export type RecordingStatus = 'idle' | 'recording' | 'paused';

export type SeverityLevel = 'good' | 'warning' | 'danger';

export interface DeviationData {
  bodyPart: string;
  deviationPercent: number;
  severity: SeverityLevel;
  landmarkIndices: number[];
}

export type DeviationMap = Record<string, DeviationData>;

export interface FrameComparisonResult {
  frameIndex: number;
  totalScore: number;
  deviations: DeviationMap;
}

export interface TrainingRecord {
  id: string;
  actionName: string;
  duration: number;
  totalScore: number;
  frames: FrameData[];
  frameResults: FrameComparisonResult[];
  deviationMap: DeviationMap;
  createdAt: number;
}

export type ActionType = 'squat' | 'pushup' | 'pullup';

export interface ReferencePose {
  actionName: string;
  landmarks: Landmark[];
  description: string;
}

export const BODY_PARTS: Record<string, number[]> = {
  head: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  shoulders: [11, 12],
  leftArm: [11, 13, 15, 17, 19, 21],
  rightArm: [12, 14, 16, 18, 20, 22],
  torso: [11, 12, 23, 24],
  leftLeg: [23, 25, 27, 29, 31],
  rightLeg: [24, 26, 28, 30, 32],
};

export const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12],
  [11, 13], [13, 15], [15, 17], [17, 19], [19, 21],
  [12, 14], [14, 16], [16, 18], [18, 20], [20, 22],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31],
  [24, 26], [26, 28], [28, 30], [30, 32],
];
