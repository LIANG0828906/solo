import { Point, DeviationArea } from '../store/useStore';

export function simplifyPath(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [];
  let prevPoint = points[0];
  result.push(prevPoint);

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    const distance = Math.sqrt(
      Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
    );
    if (distance >= tolerance / 100) {
      result.push(point);
      prevPoint = point;
    }
  }

  result.push(points[points.length - 1]);

  return ramerDouglasPeucker(result, tolerance / 100);
}

function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > epsilon) {
    const left = ramerDouglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = ramerDouglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateFrechetDistance(path1: Point[], path2: Point[]): number {
  const n = path1.length;
  const m = path2.length;

  if (n === 0 || m === 0) return Infinity;

  const dp: number[][] = Array(n)
    .fill(null)
    .map(() => Array(m).fill(Infinity));

  dp[0][0] = euclideanDistance(path1[0], path2[0]);

  for (let i = 1; i < n; i++) {
    dp[i][0] = Math.max(dp[i - 1][0], euclideanDistance(path1[i], path2[0]));
  }

  for (let j = 1; j < m; j++) {
    dp[0][j] = Math.max(dp[0][j - 1], euclideanDistance(path1[0], path2[j]));
  }

  for (let i = 1; i < n; i++) {
    for (let j = 1; j < m; j++) {
      const dist = euclideanDistance(path1[i], path2[j]);
      dp[i][j] = Math.max(
        Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]),
        dist
      );
    }
  }

  return dp[n - 1][m - 1];
}

function euclideanDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function calculateDeviation(
  userPath: Point[],
  referencePath: Point[],
  threshold: number = 0.15
): { areas: DeviationArea[]; avgDeviation: number } {
  const areas: DeviationArea[] = [];
  let totalDeviation = 0;

  const simplifiedUser = simplifyPath(userPath, 3);
  const simplifiedRef = simplifyPath(referencePath, 3);

  for (const userPoint of simplifiedUser) {
    let minDist = Infinity;
    let closestRefPoint: Point | null = null;

    for (const refPoint of simplifiedRef) {
      const dist = euclideanDistance(userPoint, refPoint);
      if (dist < minDist) {
        minDist = dist;
        closestRefPoint = refPoint;
      }
    }

    totalDeviation += minDist;

    if (minDist > threshold && closestRefPoint) {
      const existingArea = areas.find(
        (a) => euclideanDistance({ ...a, timestamp: 0 }, { ...closestRefPoint, timestamp: 0 }) < a.radius
      );

      if (existingArea) {
        existingArea.radius = Math.max(existingArea.radius, minDist * 1.5);
        existingArea.deviationPercent = Math.max(
          existingArea.deviationPercent,
          (minDist / threshold) * 100
        );
      } else {
        areas.push({
          x: closestRefPoint.x,
          y: closestRefPoint.y,
          radius: minDist * 1.5,
          deviationPercent: (minDist / threshold) * 100,
        });
      }
    }
  }

  const avgDeviation = simplifiedUser.length > 0 ? totalDeviation / simplifiedUser.length : 0;

  return { areas, avgDeviation };
}

export function calculateScore(
  avgDeviation: number,
  userPathLength: number,
  referencePathLength: number,
  timeTaken: number
): number {
  const deviationScore = Math.max(0, 100 - avgDeviation * 300);

  const lengthRatio = Math.min(userPathLength, referencePathLength) / Math.max(userPathLength, referencePathLength);
  const lengthScore = lengthRatio * 100;

  const optimalTime = referencePathLength * 500;
  const timeRatio = Math.min(timeTaken, optimalTime) / Math.max(timeTaken, optimalTime);
  const timeScore = timeRatio * 100;

  const score = deviationScore * 0.5 + lengthScore * 0.3 + timeScore * 0.2;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += euclideanDistance(points[i], points[i - 1]);
  }
  return length;
}

export function generateSuggestion(
  strokeIndex: number,
  deviationAreas: DeviationArea[],
  score: number,
  suggestions: { type: string; text: string }[]
): string {
  if (score >= 85) {
    const goodSuggestion = suggestions.find((s) => s.type === 'good');
    return goodSuggestion ? goodSuggestion.text : '笔势精妙，深得书法之趣！';
  }

  if (deviationAreas.length === 0) {
    return suggestions[0]?.text || '继续练习，必有所成。';
  }

  const avgDeviation = deviationAreas.reduce((sum, d) => sum + d.deviationPercent, 0) / deviationAreas.length;

  if (avgDeviation > 60) {
    return suggestions[2]?.text || '偏差较大，请仔细观察范字走势。';
  } else if (avgDeviation > 40) {
    return suggestions[1]?.text || '部分区域需要加强，请留意范字细节。';
  } else {
    return suggestions[3]?.text || '已有小成，精益求精会更好。';
  }
}

export function analyzeStroke(userPath: Point[], referencePath: Point[]): {
  startPressure: number;
  endPressure: number;
  speedVariation: number;
  smoothness: number;
} {
  const startPressure = userPath[0]?.pressure ?? 0.5;
  const endPressure = userPath[userPath.length - 1]?.pressure ?? 0.5;

  let totalSpeed = 0;
  let speedCount = 0;
  for (let i = 1; i < userPath.length; i++) {
    const dist = euclideanDistance(userPath[i], userPath[i - 1]);
    const time = (userPath[i].timestamp - userPath[i - 1].timestamp) / 1000;
    if (time > 0) {
      totalSpeed += dist / time;
      speedCount++;
    }
  }
  const avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

  let speedVariance = 0;
  for (let i = 1; i < userPath.length; i++) {
    const dist = euclideanDistance(userPath[i], userPath[i - 1]);
    const time = (userPath[i].timestamp - userPath[i - 1].timestamp) / 1000;
    if (time > 0) {
      const speed = dist / time;
      speedVariance += Math.pow(speed - avgSpeed, 2);
    }
  }
  const speedVariation = speedCount > 0 ? Math.sqrt(speedVariance / speedCount) : 0;

  const simplified = simplifyPath(userPath, 2);
  const smoothness = 1 - Math.min(1, Math.abs(simplified.length - referencePath.length) / referencePath.length);

  return {
    startPressure,
    endPressure,
    speedVariation,
    smoothness,
  };
}
