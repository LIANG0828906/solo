export interface Point {
  x: number;
  y: number;
}

export interface Reef {
  id: number;
  x: number;
  y: number;
  points: Point[];
  opacity: number;
  radius: number;
}

export interface WaveZone {
  id: number;
  x: number;
  y: number;
  a: number;
  b: number;
  phase: number;
  speed: number;
  baseY: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BOUNDARY_MARGIN = 60;
const REEF_MIN_SIZE = 10;
const REEF_MAX_SIZE = 25;
const WAVE_MIN_A = 20;
const WAVE_MAX_A = 35;
const WAVE_MIN_B = 10;
const WAVE_MAX_B = 20;

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

function generateIrregularPolygon(cx: number, cy: number, size: number): Point[] {
  const sides = randomInt(5, 8);
  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + Math.random() * 0.3;
    const r = size * randomRange(0.7, 1.2);
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r
    });
  }
  return points;
}

function distanceToPolygon(px: number, py: number, points: Point[]): number {
  let minDist = Infinity;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dist = distanceToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  if (pointInPolygon(px, py, points)) {
    return 0;
  }
  return minDist;
}

function pointInPolygon(px: number, py: number, points: Point[]): boolean {
  let inside = false;
  const n = points.length;
  let j = n - 1;
  for (let i = 0; i < n; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export function generateReefs(count: number, existingReefs: Reef[] = []): Reef[] {
  const reefs: Reef[] = [...existingReefs];
  let idCounter = reefs.length > 0 ? Math.max(...reefs.map(r => r.id)) + 1 : 0;
  let attempts = 0;
  const maxAttempts = count * 50;

  while (reefs.length < count && attempts < maxAttempts) {
    attempts++;
    const size = randomRange(REEF_MIN_SIZE, REEF_MAX_SIZE);
    const x = randomRange(BOUNDARY_MARGIN, CANVAS_WIDTH - BOUNDARY_MARGIN);
    const y = randomRange(BOUNDARY_MARGIN, CANVAS_HEIGHT - BOUNDARY_MARGIN);

    let overlaps = false;
    for (const reef of reefs) {
      const dist = Math.hypot(reef.x - x, reef.y - y);
      if (dist < reef.radius + size + 15) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      reefs.push({
        id: idCounter++,
        x,
        y,
        points: generateIrregularPolygon(x, y, size),
        opacity: 0,
        radius: size * 1.2
      });
    }
  }
  return reefs;
}

export function generateWaveZones(count: number, existingWaves: WaveZone[] = []): WaveZone[] {
  const waves: WaveZone[] = [...existingWaves];
  let idCounter = waves.length > 0 ? Math.max(...waves.map(w => w.id)) + 1 : 0;
  let attempts = 0;
  const maxAttempts = count * 50;

  while (waves.length < count && attempts < maxAttempts) {
    attempts++;
    const a = randomRange(WAVE_MIN_A, WAVE_MAX_A);
    const b = randomRange(WAVE_MIN_B, WAVE_MAX_B);
    const x = randomRange(BOUNDARY_MARGIN, CANVAS_WIDTH - BOUNDARY_MARGIN);
    const y = randomRange(BOUNDARY_MARGIN, CANVAS_HEIGHT - BOUNDARY_MARGIN);

    let overlaps = false;
    for (const wave of waves) {
      const dist = Math.hypot(wave.x - x, wave.y - y);
      if (dist < wave.a + a + 20) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      waves.push({
        id: idCounter++,
        x,
        y,
        a,
        b,
        phase: Math.random() * Math.PI * 2,
        speed: randomRange(Math.PI / 2, Math.PI),
        baseY: y
      });
    }
  }
  return waves;
}

export function updateReefs(reefs: Reef[], dt: number): Reef[] {
  return reefs.map(reef => ({
    ...reef,
    opacity: Math.min(1, reef.opacity + dt / 0.3)
  }));
}

export function updateWaveZones(waves: WaveZone[], dt: number): WaveZone[] {
  return waves.map(wave => {
    const newPhase = wave.phase + wave.speed * dt;
    const offset = Math.sin(newPhase) * 15;
    return {
      ...wave,
      phase: newPhase,
      y: wave.baseY + offset
    };
  });
}

export function checkShipReefCollision(
  shipX: number,
  shipY: number,
  reefs: Reef[]
): Reef | null {
  for (const reef of reefs) {
    const dist = distanceToPolygon(shipX, shipY, reef.points);
    if (dist < 20) {
      return reef;
    }
  }
  return null;
}

export function checkShipWaveCollision(
  shipX: number,
  shipY: number,
  waves: WaveZone[]
): WaveZone | null {
  for (const wave of waves) {
    const dx = shipX - wave.x;
    const dy = shipY - wave.y;
    if ((dx * dx) / (wave.a * wave.a) + (dy * dy) / (wave.b * wave.b) <= 1) {
      return wave;
    }
  }
  return null;
}

export interface ObstacleDetectionResult {
  hasObstacleAhead: boolean;
  obstacleAngle: number;
  distance: number;
  type: 'reef' | 'wave';
}

export function detectObstaclesAhead(
  shipX: number,
  shipY: number,
  heading: number,
  reefs: Reef[],
  waves: WaveZone[],
  range: number = 120
): ObstacleDetectionResult[] {
  const results: ObstacleDetectionResult[] = [];
  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);
  const halfCone = Math.PI / 3;

  for (const reef of reefs) {
    const dx = reef.x - shipX;
    const dy = reef.y - shipY;
    const dist = Math.hypot(dx, dy);
    if (dist > range + reef.radius) continue;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) < halfCone) {
      results.push({
        hasObstacleAhead: true,
        obstacleAngle: angleDiff,
        distance: dist,
        type: 'reef'
      });
    }
  }

  for (const wave of waves) {
    const dx = wave.x - shipX;
    const dy = wave.y - shipY;
    const dist = Math.hypot(dx, dy);
    if (dist > range + wave.a) continue;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) < halfCone) {
      results.push({
        hasObstacleAhead: true,
        obstacleAngle: angleDiff,
        distance: dist,
        type: 'wave'
      });
    }
  }

  results.sort((a, b) => a.distance - b.distance);
  return results;
}
