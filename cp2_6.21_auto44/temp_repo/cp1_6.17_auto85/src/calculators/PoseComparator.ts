import type {
  Landmark,
  FrameData,
  DeviationMap,
  DeviationData,
  FrameComparisonResult,
  SeverityLevel,
} from '@/types';
import { BODY_PARTS } from '@/types';
import referencePoses from '@/data/referencePoses.json';

const GOOD_THRESHOLD = 0.05;
const WARNING_THRESHOLD = 0.15;

function getSeverity(deviation: number): SeverityLevel {
  if (deviation <= GOOD_THRESHOLD) return 'good';
  if (deviation <= WARNING_THRESHOLD) return 'warning';
  return 'danger';
}

function normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
  if (landmarks.length < 33) return landmarks;

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const centerX = (leftHip.x + rightHip.x) / 2;
  const centerY = (leftHip.y + rightHip.y) / 2;

  const shoulderDist = Math.sqrt(
    Math.pow(landmarks[11].x - landmarks[12].x, 2) +
    Math.pow(landmarks[11].y - landmarks[12].y, 2)
  );
  const scale = shoulderDist > 0 ? 0.15 / shoulderDist : 1;

  return landmarks.map((lm) => ({
    x: (lm.x - centerX) * scale + 0.5,
    y: (lm.y - centerY) * scale + 0.5,
    z: lm.z * scale,
    visibility: lm.visibility,
  }));
}

function landmarkDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2) * 0.5
  );
}

export function compareFrames(
  userLandmarks: Landmark[],
  referenceLandmarks: Landmark[]
): { totalScore: number; deviations: DeviationMap } {
  const normalizedUser = normalizeLandmarks(userLandmarks);
  const normalizedRef = normalizeLandmarks(referenceLandmarks);

  const deviations: DeviationMap = {};
  let totalDeviation = 0;
  let totalWeight = 0;

  const partWeights: Record<string, number> = {
    head: 0.1,
    shoulders: 0.15,
    leftArm: 0.15,
    rightArm: 0.15,
    torso: 0.2,
    leftLeg: 0.125,
    rightLeg: 0.125,
  };

  for (const [partName, indices] of Object.entries(BODY_PARTS)) {
    let partDeviation = 0;
    let validCount = 0;

    for (const idx of indices) {
      if (
        normalizedUser[idx] &&
        normalizedRef[idx] &&
        normalizedUser[idx].visibility > 0.5 &&
        normalizedRef[idx].visibility > 0.5
      ) {
        partDeviation += landmarkDistance(normalizedUser[idx], normalizedRef[idx]);
        validCount++;
      }
    }

    if (validCount > 0) {
      const avgDeviation = partDeviation / validCount;
      const weight = partWeights[partName] || 0.1;

      deviations[partName] = {
        bodyPart: partName,
        deviationPercent: Math.min(avgDeviation * 10, 1),
        severity: getSeverity(avgDeviation),
        landmarkIndices: indices,
      };

      totalDeviation += avgDeviation * weight;
      totalWeight += weight;
    }
  }

  const avgTotalDeviation = totalWeight > 0 ? totalDeviation / totalWeight : 0;
  const totalScore = Math.max(0, Math.min(100, 100 - avgTotalDeviation * 300));

  return { totalScore, deviations };
}

export function compareSequence(
  userFrames: FrameData[],
  actionType: string
): {
  totalScore: number;
  frameResults: FrameComparisonResult[];
  deviationMap: DeviationMap;
} {
  const refPose = referencePoses[actionType as keyof typeof referencePoses];
  if (!refPose || userFrames.length === 0) {
    return {
      totalScore: 0,
      frameResults: [],
      deviationMap: {},
    };
  }

  const frameResults: FrameComparisonResult[] = [];
  const aggregatedDeviations: Record<string, number[]> = {};

  for (const frame of userFrames) {
    const result = compareFrames(frame.landmarks, refPose.landmarks);
    frameResults.push({
      frameIndex: frame.frameIndex,
      totalScore: result.totalScore,
      deviations: result.deviations,
    });

    for (const [part, data] of Object.entries(result.deviations)) {
      if (!aggregatedDeviations[part]) {
        aggregatedDeviations[part] = [];
      }
      aggregatedDeviations[part].push(data.deviationPercent);
    }
  }

  const deviationMap: DeviationMap = {};
  for (const [part, values] of Object.entries(aggregatedDeviations)) {
    const avgDeviation = values.reduce((a, b) => a + b, 0) / values.length;
    deviationMap[part] = {
      bodyPart: part,
      deviationPercent: avgDeviation,
      severity: getSeverity(avgDeviation / 10),
      landmarkIndices: BODY_PARTS[part] || [],
    };
  }

  const avgScore =
    frameResults.length > 0
      ? frameResults.reduce((sum, r) => sum + r.totalScore, 0) / frameResults.length
      : 0;

  return {
    totalScore: Math.round(avgScore),
    frameResults,
    deviationMap,
  };
}

export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'good':
      return '#00FF88';
    case 'warning':
      return '#FFD700';
    case 'danger':
      return '#FF4500';
    default:
      return '#00FF88';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 85) return '#00FF88';
  if (score >= 60) return '#FFD700';
  return '#FF4500';
}
