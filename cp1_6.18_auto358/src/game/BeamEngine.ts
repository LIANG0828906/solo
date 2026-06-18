import type { BeamSegment, LevelData, Lens, Point, Prism } from './types';

interface BeamState {
  pos: Point;
  angle: number;
  energy: number;
  width: number;
  depth: number;
  colorIndex: number;
}

interface Intersection {
  point: Point;
  dist: number;
  type: 'mirror' | 'lens' | 'prism' | 'attenuator' | 'boundary' | 'target';
  normal?: number;
  prism?: Prism;
}

const COLOR_START = { r: 0xff, g: 0x45, b: 0x00 };
const COLOR_END = { r: 0x8a, g: 0x2b, b: 0xe2 };
const MAX_BOUNCES = 20;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function normalizeAngle(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

function lerpColor(t: number): string {
  const r = Math.round(COLOR_START.r + (COLOR_END.r - COLOR_START.r) * t);
  const g = Math.round(COLOR_START.g + (COLOR_END.g - COLOR_START.g) * t);
  const b = Math.round(COLOR_START.b + (COLOR_END.b - COLOR_START.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getMirrorEndpoints(position: Point, angle: number, length: number): [Point, Point] {
  const rad = degToRad(angle);
  const halfLen = length / 2;
  return [
    { x: position.x - Math.cos(rad) * halfLen, y: position.y - Math.sin(rad) * halfLen },
    { x: position.x + Math.cos(rad) * halfLen, y: position.y + Math.sin(rad) * halfLen },
  ];
}

function getPrismVertices(prism: Prism): Point[] {
  const rad = degToRad(prism.rotation);
  const r = prism.sideLength / Math.sqrt(3);
  const vertices: Point[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = rad + (i * 2 * Math.PI) / 3 - Math.PI / 2;
    vertices.push({
      x: prism.position.x + r * Math.cos(angle),
      y: prism.position.y + r * Math.sin(angle),
    });
  }
  return vertices;
}

function rayLineIntersection(origin: Point, dir: Point, lineStart: Point, lineEnd: Point): { point: Point; dist: number } | null {
  const x1 = lineStart.x, y1 = lineStart.y;
  const x2 = lineEnd.x, y2 = lineEnd.y;
  const x3 = origin.x, y3 = origin.y;
  const x4 = origin.x + dir.x, y4 = origin.y + dir.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 1e-6) {
    return {
      point: { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) },
      dist: u,
    };
  }
  return null;
}

function rayCircleIntersection(origin: Point, dir: Point, center: Point, radius: number): { point: Point; dist: number } | null {
  const ox = origin.x - center.x;
  const oy = origin.y - center.y;

  const a = dir.x * dir.x + dir.y * dir.y;
  const b = 2 * (ox * dir.x + oy * dir.y);
  const c = ox * ox + oy * oy - radius * radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  const t = t1 >= 1e-6 ? t1 : t2;
  if (t < 1e-6) return null;

  return {
    point: { x: origin.x + dir.x * t, y: origin.y + dir.y * t },
    dist: t,
  };
}

function rayTriangleIntersection(origin: Point, dir: Point, v1: Point, v2: Point, v3: Point): { point: Point; dist: number } | null {
  const edges = [[v1, v2], [v2, v3], [v3, v1]];
  let closest: { point: Point; dist: number } | null = null;
  for (const [e1, e2] of edges) {
    const hit = rayLineIntersection(origin, dir, e1, e2);
    if (hit && (!closest || hit.dist < closest.dist)) {
      closest = hit;
    }
  }
  return closest;
}

function findNearestIntersection(
  pos: Point,
  angle: number,
  levelData: LevelData,
  lenses: Lens[],
  canvasWidth: number,
  canvasHeight: number
): Intersection | null {
  const rad = degToRad(angle);
  const dir = { x: Math.cos(rad), y: Math.sin(rad) };
  let nearest: Intersection | null = null;

  const boundaries = [
    { start: { x: 0, y: 0 }, end: { x: canvasWidth, y: 0 }, normal: 90 },
    { start: { x: canvasWidth, y: 0 }, end: { x: canvasWidth, y: canvasHeight }, normal: 180 },
    { start: { x: canvasWidth, y: canvasHeight }, end: { x: 0, y: canvasHeight }, normal: 270 },
    { start: { x: 0, y: canvasHeight }, end: { x: 0, y: 0 }, normal: 0 },
  ];

  for (const b of boundaries) {
    const hit = rayLineIntersection(pos, dir, b.start, b.end);
    if (hit && (!nearest || hit.dist < nearest.dist)) {
      nearest = { point: hit.point, dist: hit.dist, type: 'boundary', normal: b.normal };
    }
  }

  const targetHit = rayCircleIntersection(pos, dir, levelData.target.position, levelData.target.radius);
  if (targetHit && (!nearest || targetHit.dist < nearest.dist)) {
    nearest = { point: targetHit.point, dist: targetHit.dist, type: 'target' };
  }

  for (const mirror of levelData.mirrors) {
    const [mStart, mEnd] = getMirrorEndpoints(mirror.position, mirror.angle, mirror.length);
    const hit = rayLineIntersection(pos, dir, mStart, mEnd);
    if (hit && (!nearest || hit.dist < nearest.dist)) {
      nearest = { point: hit.point, dist: hit.dist, type: 'mirror', normal: mirror.angle + 90 };
    }
  }

  for (const lens of lenses) {
    if (!lens.placed) continue;
    const hit = rayCircleIntersection(pos, dir, lens.position, lens.radius);
    if (hit && (!nearest || hit.dist < nearest.dist)) {
      nearest = { point: hit.point, dist: hit.dist, type: 'lens', normal: lens.angle };
    }
  }

  for (const prism of levelData.prisms) {
    const verts = getPrismVertices(prism);
    const hit = rayTriangleIntersection(pos, dir, verts[0], verts[1], verts[2]);
    if (hit && (!nearest || hit.dist < nearest.dist)) {
      nearest = { point: hit.point, dist: hit.dist, type: 'prism', prism };
    }
  }

  for (const att of levelData.attenuators) {
    const hit = rayCircleIntersection(pos, dir, att.position, att.radius);
    if (hit && (!nearest || hit.dist < nearest.dist)) {
      nearest = { point: hit.point, dist: hit.dist, type: 'attenuator' };
    }
  }

  return nearest;
}

function stepForward(pos: Point, angle: number, dist: number): Point {
  const rad = degToRad(angle);
  return { x: pos.x + Math.cos(rad) * dist, y: pos.y + Math.sin(rad) * dist };
}

export default function simulateBeam(
  levelData: LevelData,
  lenses: Lens[],
  canvasWidth: number,
  canvasHeight: number
): BeamSegment[] {
  const segments: BeamSegment[] = [];
  const queue: BeamState[] = [];
  let targetHit = false;

  levelData.target.hit = false;

  queue.push({
    pos: { ...levelData.beamStart },
    angle: levelData.beamAngle,
    energy: 1,
    width: 3,
    depth: 0,
    colorIndex: 0,
  });

  while (queue.length > 0) {
    const beam = queue.shift()!;
    if (beam.depth >= MAX_BOUNCES || beam.energy < 0.05) continue;

    const intersection = findNearestIntersection(beam.pos, beam.angle, levelData, lenses, canvasWidth, canvasHeight);
    const color = lerpColor(Math.min(beam.depth / MAX_BOUNCES, 1));

    if (!intersection) {
      const endPoint = stepForward(beam.pos, beam.angle, 2000);
      segments.push({ start: { ...beam.pos }, end: endPoint, color, width: beam.width, energy: beam.energy });
      continue;
    }

    segments.push({ start: { ...beam.pos }, end: { ...intersection.point }, color, width: beam.width, energy: beam.energy });

    if (intersection.type === 'target') {
      targetHit = true;
      continue;
    }

    if (intersection.type === 'boundary') {
      continue;
    }

    if (intersection.type === 'mirror' && intersection.normal !== undefined) {
      const reflectedAngle = normalizeAngle(2 * intersection.normal - beam.angle);
      queue.push({
        pos: stepForward(intersection.point, reflectedAngle, 0.5),
        angle: reflectedAngle,
        energy: beam.energy * 0.92,
        width: beam.width,
        depth: beam.depth + 1,
        colorIndex: beam.colorIndex,
      });
      continue;
    }

    if (intersection.type === 'lens' && intersection.normal !== undefined) {
      const refractedAngle = normalizeAngle(beam.angle + (intersection.normal - beam.angle) * 0.35);
      queue.push({
        pos: stepForward(intersection.point, refractedAngle, 0.5),
        angle: refractedAngle,
        energy: beam.energy * 0.95,
        width: beam.width,
        depth: beam.depth + 1,
        colorIndex: beam.colorIndex,
      });
      continue;
    }

    if (intersection.type === 'attenuator') {
      const exitPoint = stepForward(intersection.point, beam.angle, 0.5);
      queue.push({
        pos: exitPoint,
        angle: beam.angle,
        energy: beam.energy * 0.5,
        width: beam.width * 0.5,
        depth: beam.depth + 1,
        colorIndex: beam.colorIndex,
      });
      continue;
    }

    if (intersection.type === 'prism' && intersection.prism) {
      const refractions = [28, 24, 20];
      for (const delta of refractions) {
        const splitAngle = normalizeAngle(beam.angle + delta - 24);
        queue.push({
          pos: stepForward(intersection.point, splitAngle, 0.5),
          angle: splitAngle,
          energy: beam.energy * 0.7,
          width: beam.width * 0.8,
          depth: beam.depth + 1,
          colorIndex: beam.colorIndex,
        });
      }
      continue;
    }
  }

  if (targetHit) {
    levelData.target.hit = true;
  }

  return segments;
}
