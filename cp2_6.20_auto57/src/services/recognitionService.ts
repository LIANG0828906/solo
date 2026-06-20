import axios from 'axios';

export interface Stroke {
  points: Array<{ x: number; y: number; timestamp: number }>;
}

export interface RecognizedNote {
  type: 'whole' | 'half' | 'quarter' | 'eighth';
  pitch: string;
  octave: number;
  confidence: number;
  y: number;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

const STROKE_GROUP_DISTANCE = 30;
const PITCH_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function computeBoundingBox(points: Array<{ x: number; y: number }>): BoundingBox {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function groupStrokes(strokes: Stroke[]): Stroke[][] {
  if (strokes.length === 0) return [];
  const boxes = strokes.map((s) => computeBoundingBox(s.points));
  const groups: Stroke[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < strokes.length; i++) {
    if (assigned.has(i)) continue;
    const group: Stroke[] = [strokes[i]];
    assigned.add(i);

    for (let j = i + 1; j < strokes.length; j++) {
      if (assigned.has(j)) continue;
      const dx = Math.abs(boxes[i].centerX - boxes[j].centerX);
      if (dx < STROKE_GROUP_DISTANCE) {
        group.push(strokes[j]);
        assigned.add(j);
      }
    }
    groups.push(group);
  }

  return groups;
}

function detectStem(points: Array<{ x: number; y: number }>): boolean {
  if (points.length < 3) return false;
  for (let i = 0; i < points.length - 2; i++) {
    const dy = Math.abs(points[i + 2].y - points[i].y);
    const dx = Math.abs(points[i + 2].x - points[i].x);
    if (dy > 15 && dy > dx * 2) return true;
  }
  return false;
}

function detectHead(points: Array<{ x: number; y: number }>, box: BoundingBox): { isFilled: boolean; density: number } {
  if (box.width < 3 || box.height < 3) return { isFilled: false, density: 0 };
  const headRegion = {
    minX: box.centerX - box.width * 0.3,
    maxX: box.centerX + box.width * 0.3,
    minY: box.centerY - box.height * 0.2,
    maxY: box.centerY + box.height * 0.2,
  };
  const regionArea = Math.max(1, (headRegion.maxX - headRegion.minX) * (headRegion.maxY - headRegion.minY));
  const count = points.filter(
    (p) =>
      p.x >= headRegion.minX &&
      p.x <= headRegion.maxX &&
      p.y >= headRegion.minY &&
      p.y <= headRegion.maxY
  ).length;
  const density = count / regionArea;
  return { isFilled: density > 0.4, density };
}

function detectFlag(points: Array<{ x: number; y: number }>, box: BoundingBox): boolean {
  const topPoints = points.filter((p) => p.y < box.minY + box.height * 0.3);
  if (topPoints.length < 2) return false;
  let hasDiagonal = false;
  for (let i = 0; i < topPoints.length - 1; i++) {
    const dx = Math.abs(topPoints[i + 1].x - topPoints[i].x);
    const dy = Math.abs(topPoints[i + 1].y - topPoints[i].y);
    if (dx > 5 && dy > 3) {
      hasDiagonal = true;
      break;
    }
  }
  return hasDiagonal;
}

function estimatePitch(y: number, canvasHeight: number): { pitch: string; octave: number } {
  const staffLineSpacing = canvasHeight / 12;
  const staffOffset = y / staffLineSpacing;
  const pitchIndex = Math.floor(staffOffset) % 7;
  const pitch = PITCH_NAMES[Math.max(0, Math.min(6, pitchIndex))];
  const octave = Math.max(3, Math.min(6, 6 - Math.floor(y / (canvasHeight / 4))));
  return { pitch, octave };
}

export function recognizeNotes(strokes: Stroke[], canvasHeight: number): RecognizedNote[] {
  if (strokes.length === 0) return [];

  const groups = groupStrokes(strokes);
  const results: RecognizedNote[] = [];

  for (const group of groups) {
    const allPoints = group.flatMap((s) => s.points);
    const box = computeBoundingBox(allPoints);

    const hasStem = group.some((s) => detectStem(s.points));
    const { isFilled } = detectHead(allPoints, box);
    const hasFlag = detectFlag(allPoints, box);

    let type: RecognizedNote['type'];
    if (!hasStem && !isFilled) {
      type = 'whole';
    } else if (hasStem && !isFilled) {
      type = 'half';
    } else if (hasStem && isFilled && !hasFlag) {
      type = 'quarter';
    } else {
      type = 'eighth';
    }

    const { pitch, octave } = estimatePitch(box.centerY, canvasHeight);

    const confidence = Math.min(1, Math.max(0.3,
      (box.width > 5 ? 0.3 : 0) +
      (box.height > 10 ? 0.3 : 0) +
      (hasStem ? 0.2 : 0.1) +
      (allPoints.length > 5 ? 0.2 : 0)
    ));

    results.push({
      type,
      pitch,
      octave,
      confidence,
      y: box.centerY,
    });
  }

  return results.sort((a, b) => a.y - b.y);
}

export async function recognizeViaAPI(strokes: Stroke[]): Promise<RecognizedNote[]> {
  const response = await axios.post<RecognizedNote[]>('/api/recognize', { strokes });
  return response.data;
}
