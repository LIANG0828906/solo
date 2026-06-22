export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function generateSampleData(count: number = 10000): Point3D[] {
  const points: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 12;
    const radius = t * 2;
    points.push({
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.15,
      y: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.15,
      z: t * 3 + (Math.random() - 0.5) * 0.15,
    });
  }
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points;
}

export function samplePoints(points: Point3D[], percentage: number): Point3D[] {
  if (percentage >= 100) return points;
  if (percentage <= 0) return [];
  const count = Math.max(1, Math.round(points.length * (percentage / 100)));
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * points.length));
  }
  return Array.from(indices).map((i) => points[i]);
}

export function parsePLY(text: string): Point3D[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let vertexCount = 0;
  let headerEnd = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('element vertex')) {
      vertexCount = parseInt(lines[i].split(/\s+/)[2], 10);
    }
    if (lines[i] === 'end_header') {
      headerEnd = i + 1;
      break;
    }
  }
  const points: Point3D[] = [];
  for (let i = headerEnd; i < Math.min(headerEnd + vertexCount, lines.length); i++) {
    const parts = lines[i].split(/\s+/).map(Number);
    if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
      points.push({ x: parts[0], y: parts[1], z: parts[2] });
    }
  }
  return points;
}

export function parseXYZ(text: string): Point3D[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const points: Point3D[] = [];
  for (const line of lines) {
    const parts = line.split(/[\s,]+/).map(Number);
    if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
      points.push({ x: parts[0], y: parts[1], z: parts[2] });
    }
  }
  return points;
}
