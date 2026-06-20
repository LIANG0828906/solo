export interface Point {
  x: number;
  y: number;
  timestamp?: number;
}

export type RuneType = 'triangle' | 'square' | 'pentagram' | 'spiral' | 'lightning' | 'crescent';

export type SpellElement = 'fire' | 'ice' | 'lightning';

export interface RuneDefinition {
  id: RuneType;
  name: string;
  icon: string;
  element: SpellElement;
  color: string;
  baseDamage: number;
  damage: number;
  manaCost: number;
  optimalTime: number;
  cooldown: number;
  pattern: Point[];
  threshold: number;
}

export interface MatchResult {
  matched: boolean;
  runeId: RuneType | null;
  similarity: number;
  accuracy: number;
  speedFactor: number;
  damageMultiplier: number;
  castTime: number;
  matchedRune: RuneDefinition | null;
  rune: RuneDefinition | null;
  damage: number;
  drawTime: number;
}

export interface SpellCastEvent {
  runeId: RuneType;
  rune: RuneDefinition;
  damage: number;
  accuracy: number;
  speedFactor: number;
  similarity: number;
  timestamp: number;
  manaCost: number;
  combo: number;
}

const RESAMPLE_COUNT = 64;

function interpolateLinear(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

function normalizePoints(points: Point[]): Point[] {
  if (points.length === 0) return [];

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.max(width, height) || 1;
  const offsetX = (100 - (width / scale) * 100) / 2;
  const offsetY = (100 - (height / scale) * 100) / 2;

  return points.map(p => ({
    x: ((p.x - minX) / scale) * 100 + offsetX,
    y: ((p.y - minY) / scale) * 100 + offsetY,
    timestamp: p.timestamp,
  }));
}

function resample(points: Point[], count: number = RESAMPLE_COUNT): Point[] {
  if (points.length < 2) return points.slice();

  const totalLen = pathLength(points);
  if (totalLen === 0) {
    return Array(count).fill(null).map(() => ({ ...points[0] }));
  }

  const interval = totalLen / (count - 1);
  const result: Point[] = [{ ...points[0] }];
  let accumulated = 0;
  let prev = points[0];

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    let segLen = distance(prev, curr);

    while (accumulated + segLen >= interval && result.length < count) {
      const t = (interval - accumulated) / segLen;
      const newPoint = interpolateLinear(prev, curr, t);
      result.push(newPoint);
      prev = newPoint;
      segLen = distance(prev, curr);
      accumulated = 0;
    }

    accumulated += segLen;
    prev = curr;
  }

  while (result.length < count) {
    result.push({ ...points[points.length - 1] });
  }

  return result;
}

function nearestPointDistance(p: Point, candidates: Point[]): number {
  let min = Infinity;
  for (const c of candidates) {
    const d = distance(p, c);
    if (d < min) min = d;
  }
  return min;
}

function averageNearestDistance(a: Point[], b: Point[]): number {
  let sum = 0;
  for (const p of a) {
    sum += nearestPointDistance(p, b);
  }
  return sum / a.length;
}

function computeSimilarity(a: Point[], b: Point[]): number {
  const ra = resample(normalizePoints(a));
  const rb = resample(normalizePoints(b));

  const d1 = averageNearestDistance(ra, rb);
  const d2 = averageNearestDistance(rb, ra);
  const avgDist = (d1 + d2) / 2;

  const maxDist = 100 * Math.SQRT2;
  const similarity = Math.max(0, 1 - avgDist / (maxDist * 0.25));

  return similarity;
}

function generateInterpolatedPolygon(vertices: Point[], pointsPerEdge: number): Point[] {
  const result: Point[] = [];
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    for (let j = 0; j < pointsPerEdge; j++) {
      const t = j / pointsPerEdge;
      result.push(interpolateLinear(a, b, t));
    }
  }

  return result;
}

function generateTrianglePattern(): Point[] {
  const vertices: Point[] = [
    { x: 50, y: 10 },
    { x: 90, y: 85 },
    { x: 10, y: 85 },
  ];
  return generateInterpolatedPolygon(vertices, 22);
}

function generateSquarePattern(): Point[] {
  const vertices: Point[] = [
    { x: 15, y: 15 },
    { x: 85, y: 15 },
    { x: 85, y: 85 },
    { x: 15, y: 85 },
  ];
  return generateInterpolatedPolygon(vertices, 16);
}

function generatePentagramPattern(): Point[] {
  const cx = 50, cy = 50, r = 42;
  const vertices: Point[] = [];
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < 5; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / 5;
    vertices.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  const order = [0, 2, 4, 1, 3];
  const orderedVertices = order.map(i => vertices[i]);

  const result: Point[] = [];
  for (let i = 0; i < orderedVertices.length; i++) {
    const a = orderedVertices[i];
    const b = orderedVertices[(i + 1) % orderedVertices.length];
    for (let j = 0; j < 13; j++) {
      const t = j / 13;
      result.push(interpolateLinear(a, b, t));
    }
  }

  return result;
}

function generateSpiralPattern(): Point[] {
  const cx = 50, cy = 50;
  const turns = 3;
  const maxR = 42;
  const totalPoints = RESAMPLE_COUNT;
  const result: Point[] = [];

  for (let i = 0; i < totalPoints; i++) {
    const t = i / (totalPoints - 1);
    const angle = t * turns * 2 * Math.PI;
    const r = t * maxR;
    result.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  return result;
}

function generateLightningPattern(): Point[] {
  const waypoints: Point[] = [
    { x: 40, y: 5 },
    { x: 60, y: 30 },
    { x: 35, y: 45 },
    { x: 65, y: 70 },
    { x: 50, y: 95 },
  ];

  const result: Point[] = [];
  const pointsPerSegment = Math.floor(RESAMPLE_COUNT / (waypoints.length - 1));

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const count = i === waypoints.length - 2
      ? RESAMPLE_COUNT - result.length
      : pointsPerSegment;
    for (let j = 0; j < count; j++) {
      const t = j / count;
      result.push(interpolateLinear(a, b, t));
    }
  }

  return result;
}

function generateCrescentPattern(): Point[] {
  const cx = 50, cy = 50;
  const rOuter = 42;
  const rInner = 30;
  const offsetX = 12;
  const totalPoints = RESAMPLE_COUNT;
  const result: Point[] = [];

  const startAngle = -Math.PI * 0.7;
  const endAngle = Math.PI * 0.7;
  const arcPoints = Math.floor(totalPoints * 0.6);

  for (let i = 0; i < arcPoints; i++) {
    const t = i / (arcPoints - 1);
    const angle = startAngle + (endAngle - startAngle) * t;
    result.push({
      x: cx + rOuter * Math.cos(angle),
      y: cy + rOuter * Math.sin(angle),
    });
  }

  const innerStart = endAngle;
  const innerEnd = startAngle;
  const innerPoints = totalPoints - arcPoints;

  for (let i = 0; i < innerPoints; i++) {
    const t = i / (innerPoints - 1);
    const angle = innerStart + (innerEnd - innerStart) * t;
    result.push({
      x: cx + offsetX + rInner * Math.cos(angle),
      y: cy + rInner * Math.sin(angle),
    });
  }

  return result;
}

function generateRunePattern(type: RuneType): Point[] {
  switch (type) {
    case 'triangle': return generateTrianglePattern();
    case 'square': return generateSquarePattern();
    case 'pentagram': return generatePentagramPattern();
    case 'spiral': return generateSpiralPattern();
    case 'lightning': return generateLightningPattern();
    case 'crescent': return generateCrescentPattern();
  }
}

export class RuneSystem {
  private runes: RuneDefinition[];

  constructor() {
    this.runes = [
      {
        id: 'triangle',
        name: '烈焰三角',
        icon: '△',
        element: 'fire',
        color: '#ff4500',
        baseDamage: 25,
        damage: 25,
        manaCost: 15,
        optimalTime: 1500,
        cooldown: 2000,
        pattern: generateRunePattern('triangle'),
        threshold: 0.7,
      },
      {
        id: 'square',
        name: '冰霜方阵',
        icon: '□',
        element: 'ice',
        color: '#00bfff',
        baseDamage: 20,
        damage: 20,
        manaCost: 12,
        optimalTime: 1800,
        cooldown: 2500,
        pattern: generateRunePattern('square'),
        threshold: 0.7,
      },
      {
        id: 'pentagram',
        name: '雷霆五芒',
        icon: '☆',
        element: 'lightning',
        color: '#ffd700',
        baseDamage: 35,
        damage: 35,
        manaCost: 25,
        optimalTime: 2500,
        cooldown: 3500,
        pattern: generateRunePattern('pentagram'),
        threshold: 0.65,
      },
      {
        id: 'spiral',
        name: '炎涡螺旋',
        icon: '🌀',
        element: 'fire',
        color: '#ff4500',
        baseDamage: 30,
        damage: 30,
        manaCost: 20,
        optimalTime: 2200,
        cooldown: 3000,
        pattern: generateRunePattern('spiral'),
        threshold: 0.65,
      },
      {
        id: 'lightning',
        name: '奔雷折线',
        icon: '⚡',
        element: 'lightning',
        color: '#ffd700',
        baseDamage: 40,
        damage: 40,
        manaCost: 22,
        optimalTime: 1200,
        cooldown: 2800,
        pattern: generateRunePattern('lightning'),
        threshold: 0.6,
      },
      {
        id: 'crescent',
        name: '寒霜新月',
        icon: '☽',
        element: 'ice',
        color: '#00bfff',
        baseDamage: 28,
        damage: 28,
        manaCost: 18,
        optimalTime: 2000,
        cooldown: 2800,
        pattern: generateRunePattern('crescent'),
        threshold: 0.65,
      },
    ];
  }

  getRunes(): RuneDefinition[] {
    return this.runes.map(r => ({ ...r, pattern: r.pattern.slice() }));
  }

  getRuneById(id: RuneType): RuneDefinition | undefined {
    const rune = this.runes.find(r => r.id === id);
    if (!rune) return undefined;
    return { ...rune, pattern: rune.pattern.slice() };
  }

  matchPattern(points: Point[]): MatchResult {
    const emptyResult: MatchResult = {
      matched: false,
      runeId: null,
      accuracy: 0,
      speedFactor: 0,
      damage: 0,
      damageMultiplier: 0,
      similarity: 0,
      drawTime: 0,
      castTime: 0,
      matchedRune: null,
      rune: null,
    };

    if (points.length < 3) return emptyResult;

    let drawTime = 0;
    if (points[0].timestamp !== undefined && points[points.length - 1].timestamp !== undefined) {
      drawTime = points[points.length - 1].timestamp! - points[0].timestamp!;
    }

    let bestRune: RuneDefinition | undefined;
    let bestSimilarity = 0;

    for (const rune of this.runes) {
      const similarity = computeSimilarity(points, rune.pattern);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestRune = rune;
      }
    }

    if (!bestRune || bestSimilarity < bestRune.threshold) {
      return {
        ...emptyResult,
        accuracy: bestSimilarity,
        similarity: bestSimilarity,
        drawTime,
        castTime: drawTime,
        rune: null,
      };
    }

    const accuracy = bestSimilarity;
    let speedFactor = 1;
    if (drawTime > 0 && bestRune.optimalTime > 0) {
      const ratio = drawTime / bestRune.optimalTime;
      if (ratio <= 1) {
        speedFactor = 0.5 + 0.5 * ratio;
      } else {
        speedFactor = Math.max(0.3, 1 - (ratio - 1) * 0.5);
      }
    }

    const damageMultiplier = accuracy * speedFactor;
    const damage = Math.round(bestRune.baseDamage * damageMultiplier);
    const runeCopy = { ...bestRune, pattern: bestRune.pattern.slice() };

    return {
      matched: true,
      rune: runeCopy,
      runeId: bestRune.id,
      matchedRune: runeCopy,
      accuracy,
      speedFactor,
      damage,
      damageMultiplier,
      similarity: bestSimilarity,
      drawTime,
      castTime: drawTime,
    };
  }
}
