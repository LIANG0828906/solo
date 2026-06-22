import type { PatternPoint } from '../types';

export function generateWavePattern(
  iconCount: number,
  width: number,
  height: number,
  density: number
): PatternPoint[] {
  const points: PatternPoint[] = [];
  const amplitude = height * 0.3;
  const densityFactor = density / 100;
  const wavelength = width / (iconCount * densityFactor);
  const angularVelocity = (2 * Math.PI) / wavelength;

  for (let i = 0; i < iconCount; i++) {
    const x = (width / (iconCount + 1)) * (i + 1);
    const y = height / 2 + amplitude * Math.sin(angularVelocity * x);
    const rotation = Math.random() * 30 - 15;
    points.push({ x, y, rotation, alpha: 1.0 });
  }

  return points;
}

export function generateSpiralPattern(
  iconCount: number,
  width: number,
  height: number,
  density: number
): PatternPoint[] {
  const points: PatternPoint[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.45;
  const turns = 2.5;
  const pointsPerTurn = iconCount / turns;
  const densityFactor = density / 100;

  for (let i = 0; i < iconCount; i++) {
    const angle = (i / pointsPerTurn) * 2 * Math.PI;
    const radius = maxRadius * (i / iconCount) * densityFactor;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const rotation = (angle * 180) / Math.PI;
    const scale = 1.0 - 0.4 * (i / iconCount);
    points.push({ x, y, rotation, scale });
  }

  return points;
}

export function generateRandomPattern(
  iconCount: number,
  width: number,
  height: number,
  density: number
): PatternPoint[] {
  const points: PatternPoint[] = [];
  let minSpacing = 60 + (200 - density) / 2;
  const margin = 30;
  const targetCoverage = width * height * 0.6;

  const checkDistance = (x: number, y: number): boolean => {
    for (const point of points) {
      const dx = point.x - x;
      const dy = point.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minSpacing) {
        return false;
      }
    }
    return true;
  };

  const tryPlacePoints = (): boolean => {
    while (points.length < iconCount) {
      let placed = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const x = margin + Math.random() * (width - 2 * margin);
        const y = margin + Math.random() * (height - 2 * margin);
        if (checkDistance(x, y)) {
          points.push({ x, y });
          placed = true;
          break;
        }
      }
      if (!placed) {
        return false;
      }
    }
    return true;
  };

  while (!tryPlacePoints() && minSpacing > 20) {
    minSpacing -= 5;
    points.length = 0;
  }

  if (points.length < iconCount) {
    for (let i = points.length; i < iconCount; i++) {
      const x = margin + Math.random() * (width - 2 * margin);
      const y = margin + Math.random() * (height - 2 * margin);
      points.push({ x, y });
    }
  }

  let coverageArea = points.length * Math.PI * Math.pow(minSpacing / 2, 2);
  if (coverageArea < targetCoverage && minSpacing > 30) {
    const expandFactor = Math.sqrt(targetCoverage / coverageArea);
    const centerX = width / 2;
    const centerY = height / 2;
    for (const point of points) {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const newDist = Math.min(dist * expandFactor, maxRadius(width, height));
        point.x = centerX + (dx / dist) * newDist;
        point.y = centerY + (dy / dist) * newDist;
      }
    }
  }

  return points;
}

function maxRadius(width: number, height: number): number {
  return Math.min(width, height) * 0.45;
}
