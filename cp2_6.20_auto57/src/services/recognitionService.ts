import axios from 'axios';

export interface Stroke {
  points: Array<{ x: number; y: number; timestamp: number }>;
}

export interface RecognizedNoteResult {
  id?: string;
  type: 'whole' | 'half' | 'quarter' | 'eighth';
  pitch: string;
  octave: number;
  duration: number;
  confidence: number;
  valid: boolean;
  x: number;
  y: number;
  bounds: { x: number; y: number; w: number; h: number };
}

export interface StrokeFeatures {
  strokeIndex: number;
  boundingBox: { x: number; y: number; w: number; h: number; cx: number; cy: number };
  totalLength: number;
  startEndDistance: number;
  closureRatio: number;
  aspectRatio: number;
  isClosedLoop: boolean;
  stem: { detected: boolean; verticalLength: number; direction: 'up' | 'down' | null; maxDyDx: number };
  flag: { detected: boolean; curvatureSum: number; diagonalScore: number };
  filled: { density: number; interiorRatio: number; isFilled: boolean };
}

interface BoundingBox {
  minX: number; maxX: number; minY: number; maxY: number;
  width: number; height: number; centerX: number; centerY: number;
}

const STROKE_GROUP_DISTANCE = 35;
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
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function computePathLength(points: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

function isClosedLoop(points: Array<{ x: number; y: number }>, box: BoundingBox): { ratio: number; isClosed: boolean } {
  if (points.length < 5) return { ratio: 1, isClosed: false };
  const startEnd = Math.hypot(
    points[0].x - points[points.length - 1].x,
    points[0].y - points[points.length - 1].y
  );
  const totalLen = computePathLength(points);
  if (totalLen < 10) return { ratio: 1, isClosed: false };
  const ratio = startEnd / totalLen;
  const ar = box.width > 0 && box.height > 0 ? Math.max(box.width, box.height) / Math.min(box.width, box.height) : 10;
  const aspectOk = ar >= 1.0 && ar <= 2.2;
  return { ratio, isClosed: ratio < 0.2 && aspectOk && box.width > 8 && box.height > 6 };
}

function detectStemFeatures(points: Array<{ x: number; y: number }>, headCenterY: number | null): {
  detected: boolean; verticalLength: number; direction: 'up' | 'down' | null; maxDyDx: number;
} {
  if (points.length < 4) return { detected: false, verticalLength: 0, direction: null, maxDyDx: 0 };
  let maxDyDx = 0;
  let maxVertLen = 0;
  for (let i = 0; i < points.length - 2; i++) {
    const dy = Math.abs(points[i + 2].y - points[i].y);
    const dx = Math.max(Math.abs(points[i + 2].x - points[i].x), 0.001);
    const ratio = dy / dx;
    if (ratio > maxDyDx) maxDyDx = ratio;
    if (ratio > 2.5 && dy > maxVertLen) maxVertLen = dy;
  }
  const detected = maxDyDx > 2.5 && maxVertLen > 15;
  let direction: 'up' | 'down' | null = null;
  if (detected && headCenterY !== null) {
    const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
    direction = avgY < headCenterY ? 'up' : 'down';
  }
  return { detected, verticalLength: maxVertLen, direction, maxDyDx };
}

function detectFilledHead(points: Array<{ x: number; y: number }>, box: BoundingBox): {
  density: number; interiorRatio: number; isFilled: boolean;
} {
  if (box.width < 5 || box.height < 5) return { density: 0, interiorRatio: 0, isFilled: false };
  const gridSize = 10;
  const cellW = box.width / gridSize;
  const cellH = box.height / gridSize;
  const filledCells = new Set<string>();
  let interiorCount = 0;
  let edgeCount = 0;
  const cx = box.centerX, cy = box.centerY;
  const innerW = box.width * 0.3, innerH = box.height * 0.3;
  for (const p of points) {
    if (p.x < box.minX || p.x > box.maxX || p.y < box.minY || p.y > box.maxY) continue;
    const gx = Math.min(gridSize - 1, Math.floor((p.x - box.minX) / cellW));
    const gy = Math.min(gridSize - 1, Math.floor((p.y - box.minY) / cellH));
    filledCells.add(`${gx},${gy}`);
    const inInnerX = Math.abs(p.x - cx) < innerW;
    const inInnerY = Math.abs(p.y - cy) < innerH;
    if (inInnerX && inInnerY) interiorCount++;
    else edgeCount++;
  }
  const density = filledCells.size / (gridSize * gridSize);
  const total = interiorCount + edgeCount;
  const interiorRatio = total > 0 ? interiorCount / total : 0;
  const isFilled = density > 0.55 && interiorRatio > 0.45;
  return { density, interiorRatio, isFilled };
}

function detectFlagFeatures(points: Array<{ x: number; y: number }>, box: BoundingBox, stemDir: 'up' | 'down' | null): {
  detected: boolean; curvatureSum: number; diagonalScore: number;
} {
  if (points.length < 5) return { detected: false, curvatureSum: 0, diagonalScore: 0 };
  const strokeBox = computeBoundingBox(points);
  let inFlagZone = false;
  if (stemDir === 'up') {
    inFlagZone = strokeBox.maxY < box.minY + box.height * 0.25;
  } else if (stemDir === 'down') {
    inFlagZone = strokeBox.minY > box.maxY - box.height * 0.25;
  } else {
    const inTop = strokeBox.maxY < box.minY + box.height * 0.25;
    const inBot = strokeBox.minY > box.maxY - box.height * 0.25;
    inFlagZone = inTop || inBot;
  }
  if (!inFlagZone) return { detected: false, curvatureSum: 0, diagonalScore: 0 };
  let curvatureSum = 0;
  let diagSum = 0, diagCount = 0;
  for (let i = 0; i < points.length - 3; i++) {
    const a = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y };
    const b = { x: points[i + 2].x - points[i + 1].x, y: points[i + 2].y - points[i + 1].y };
    const c = { x: points[i + 3].x - points[i + 2].x, y: points[i + 3].y - points[i + 2].y };
    const ang1 = Math.atan2(a.y, a.x);
    const ang2 = Math.atan2(b.y, b.x);
    const ang3 = Math.atan2(c.y, c.x);
    let d1 = Math.abs(ang2 - ang1);
    let d2 = Math.abs(ang3 - ang2);
    if (d1 > Math.PI) d1 = 2 * Math.PI - d1;
    if (d2 > Math.PI) d2 = 2 * Math.PI - d2;
    curvatureSum += (d1 + d2) * (180 / Math.PI);
    const dx = Math.abs(points[i + 3].x - points[i].x);
    const dy = Math.max(Math.abs(points[i + 3].y - points[i].y), 0.001);
    diagSum += dx / dy;
    diagCount++;
  }
  const diagonalScore = diagCount > 0 ? diagSum / diagCount : 0;
  const diagonalOk = diagonalScore >= 0.3 && diagonalScore <= 1.5;
  const detected = curvatureSum > 45 && diagonalOk;
  return { detected, curvatureSum, diagonalScore };
}

export function detectPitchFromY(y: number, canvasHeight: number): { pitch: string; octave: number } {
  const h = Math.max(canvasHeight, 1);
  const normalized = Math.max(0, Math.min(1, y / h));
  const bandIdx = Math.floor(normalized * 7);
  const pitch = PITCH_NAMES[Math.max(0, Math.min(6, bandIdx))];
  const octave = 6 - Math.floor(normalized * 4);
  return { pitch, octave: Math.max(3, Math.min(6, octave)) };
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

export function computeStrokeFeatures(strokes: Stroke[]): StrokeFeatures[] {
  const features: StrokeFeatures[] = [];
  for (let idx = 0; idx < strokes.length; idx++) {
    const s = strokes[idx];
    const box = computeBoundingBox(s.points);
    const len = computePathLength(s.points);
    const startEnd = Math.hypot(
      s.points[0].x - s.points[s.points.length - 1].x,
      s.points[0].y - s.points[s.points.length - 1].y
    );
    const closure = len > 0 ? startEnd / len : 1;
    const ar = box.height > 0 ? box.width / box.height : 0;
    const loop = isClosedLoop(s.points, box);
    const stem = detectStemFeatures(s.points, box.centerY);
    const flag = detectFlagFeatures(s.points, box, stem.direction);
    const filled = detectFilledHead(s.points, box);
    features.push({
      strokeIndex: idx,
      boundingBox: { x: box.minX, y: box.minY, w: box.width, h: box.height, cx: box.centerX, cy: box.centerY },
      totalLength: len,
      startEndDistance: startEnd,
      closureRatio: closure,
      aspectRatio: ar,
      isClosedLoop: loop.isClosed,
      stem,
      flag,
      filled,
    });
  }
  return features;
}

export function recognizeNotes(
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number
): RecognizedNoteResult[] {
  if (strokes.length === 0) return [];
  const groups = groupStrokes(strokes);
  const results: RecognizedNoteResult[] = [];
  for (const group of groups) {
    const allPoints = group.flatMap((s) => s.points);
    const box = computeBoundingBox(allPoints);
    const feats = computeStrokeFeatures(group);
    let headFeat: StrokeFeatures | null = null;
    let headBox: BoundingBox | null = null;
    for (const f of feats) {
      if (f.isClosedLoop) {
        headFeat = f;
        headBox = computeBoundingBox(group[f.strokeIndex].points);
        break;
      }
    }
    if (!headFeat || !headBox) {
      const margin = 8;
      results.push({
        type: 'quarter',
        pitch: 'C', octave: 4, duration: 1,
        confidence: 0.1, valid: false,
        x: box.centerX, y: box.centerY,
        bounds: {
          x: Math.max(0, box.minX - margin),
          y: Math.max(0, box.minY - margin),
          w: Math.min(canvasWidth, box.width + margin * 2),
          h: Math.min(canvasHeight, box.height + margin * 2),
        },
      });
      continue;
    }
    const headCenterY = headBox.centerY;
    let stemCount = 0;
    let stemDir: 'up' | 'down' | null = null;
    let flagCount = 0;
    for (const f of feats) {
      if (f.strokeIndex === headFeat.strokeIndex) continue;
      const sfeat = detectStemFeatures(group[f.strokeIndex].points, headCenterY);
      if (sfeat.detected) {
        stemCount++;
        stemDir = sfeat.direction;
        break;
      }
    }
    for (const f of feats) {
      if (f.strokeIndex === headFeat.strokeIndex) continue;
      const ffeat = detectFlagFeatures(group[f.strokeIndex].points, headBox, stemDir);
      if (ffeat.detected) flagCount++;
    }
    const isFilled = headFeat.filled.isFilled;
    let type: RecognizedNoteResult['type'];
    let duration: number;
    let confidence = 0.5;
    if (stemCount === 0 && !isFilled) {
      type = 'whole'; duration = 4;
      confidence = 0.7 + headFeat.closureRatio * 0.2;
    } else if (stemCount >= 1 && !isFilled) {
      type = 'half'; duration = 2;
      confidence = 0.75;
    } else if (stemCount >= 1 && isFilled && flagCount === 0) {
      type = 'quarter'; duration = 1;
      confidence = 0.8;
    } else if (stemCount >= 1 && isFilled && flagCount >= 1) {
      type = 'eighth'; duration = 0.5;
      confidence = 0.75;
    } else if (stemCount >= 2) {
      type = 'eighth'; duration = 0.5;
      confidence = 0.6;
    } else {
      type = 'quarter'; duration = 1;
      confidence = 0.4;
    }
    confidence = Math.max(0.2, Math.min(0.98, confidence));
    const pos = detectPitchFromY(headCenterY, canvasHeight);
    const noteCount = stemCount >= 2 ? 2 : 1;
    const margin = 8;
    for (let n = 0; n < noteCount; n++) {
      results.push({
        type,
        pitch: pos.pitch,
        octave: pos.octave,
        duration,
        confidence,
        valid: true,
        x: headBox.centerX + (n > 0 ? 20 : 0),
        y: headCenterY,
        bounds: {
          x: Math.max(0, headBox.minX - margin),
          y: Math.max(0, headBox.minY - margin),
          w: Math.min(canvasWidth, headBox.width + margin * 2),
          h: Math.min(canvasHeight, headBox.height + margin * 2),
        },
      });
    }
  }
  return results.sort((a, b) => a.x - b.x);
}

export async function recognizeViaAPI(strokes: Stroke[]): Promise<RecognizedNoteResult[]> {
  const response = await axios.post<RecognizedNoteResult[]>('/api/recognize', { strokes });
  return response.data;
}
