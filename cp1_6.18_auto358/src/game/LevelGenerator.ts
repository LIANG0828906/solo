import { v4 as uuidv4 } from 'uuid';
import type { LevelData, Point, Mirror, Prism, Attenuator, Target } from './types';

const GRID_SIZE = 8;
const CELL_SIZE = 60;
const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE;
const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE;

function getMirrorEndpoints(mirror: Mirror): [Point, Point] {
  const rad = (mirror.angle * Math.PI) / 180;
  const halfLen = mirror.length / 2;
  return [
    { x: mirror.position.x - Math.cos(rad) * halfLen, y: mirror.position.y - Math.sin(rad) * halfLen },
    { x: mirror.position.x + Math.cos(rad) * halfLen, y: mirror.position.y + Math.sin(rad) * halfLen },
  ];
}

function getPrismVertices(prism: Prism): Point[] {
  const rad = (prism.rotation * Math.PI) / 180;
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

function circlesOverlap(p1: Point, r1: number, p2: Point, r2: number): boolean {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y) < r1 + r2;
}

function pointInCircle(p: Point, c: Point, r: number): boolean {
  return Math.hypot(p.x - c.x, p.y - c.y) < r;
}

function segmentCircleIntersect(p1: Point, p2: Point, c: Point, r: number): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - c.x;
  const fy = p1.y - c.y;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - r * r;
  let discriminant = b * b - 4 * a * cc;
  if (discriminant < 0) return false;
  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const d1x = a2.x - a1.x, d1y = a2.y - a1.y;
  const d2x = b2.x - b1.x, d2y = b2.y - b1.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return false;
  const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / denom;
  const s = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / denom;
  return t >= 0 && t <= 1 && s >= 0 && s <= 1;
}

function pointInTriangle(p: Point, v1: Point, v2: Point, v3: Point): boolean {
  const d1 = (p.x - v2.x) * (v1.y - v2.y) - (v1.x - v2.x) * (p.y - v2.y);
  const d2 = (p.x - v3.x) * (v2.y - v3.y) - (v2.x - v3.x) * (p.y - v3.y);
  const d3 = (p.x - v1.x) * (v3.y - v1.y) - (v3.x - v1.x) * (p.y - v1.y);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function segmentTriangleIntersect(p1: Point, p2: Point, v1: Point, v2: Point, v3: Point): boolean {
  if (pointInTriangle(p1, v1, v2, v3) || pointInTriangle(p2, v1, v2, v3)) return true;
  return segmentsIntersect(p1, p2, v1, v2) || segmentsIntersect(p1, p2, v2, v3) || segmentsIntersect(p1, p2, v3, v1);
}

function mirrorOverlapsExisting(mirror: Mirror, existing: { mirrors: Mirror[]; prisms: Prism[]; attenuators: Attenuator[]; target: Target; beamStart: Point }): boolean {
  const [m1, m2] = getMirrorEndpoints(mirror);
  for (const em of existing.mirrors) {
    const [e1, e2] = getMirrorEndpoints(em);
    if (segmentsIntersect(m1, m2, e1, e2)) return true;
  }
  for (const prism of existing.prisms) {
    const pv = getPrismVertices(prism);
    if (segmentTriangleIntersect(m1, m2, pv[0], pv[1], pv[2])) return true;
  }
  for (const att of existing.attenuators) {
    if (segmentCircleIntersect(m1, m2, att.position, att.radius)) return true;
  }
  if (segmentCircleIntersect(m1, m2, existing.target.position, existing.target.radius)) return true;
  if (pointInCircle(mirror.position, existing.beamStart, 40)) return true;
  return false;
}

function prismOverlapsExisting(prism: Prism, existing: { mirrors: Mirror[]; prisms: Prism[]; attenuators: Attenuator[]; target: Target; beamStart: Point }): boolean {
  const verts = getPrismVertices(prism);
  const r = prism.sideLength / Math.sqrt(3);
  for (const em of existing.mirrors) {
    const [e1, e2] = getMirrorEndpoints(em);
    if (segmentTriangleIntersect(e1, e2, verts[0], verts[1], verts[2])) return true;
  }
  for (const ep of existing.prisms) {
    const epR = ep.sideLength / Math.sqrt(3);
    if (circlesOverlap(prism.position, r, ep.position, epR)) return true;
  }
  for (const att of existing.attenuators) {
    if (circlesOverlap(prism.position, r, att.position, att.radius)) return true;
  }
  if (circlesOverlap(prism.position, r, existing.target.position, existing.target.radius)) return true;
  if (circlesOverlap(prism.position, r, existing.beamStart, 40)) return true;
  return false;
}

function attenuatorOverlapsExisting(att: Attenuator, existing: { mirrors: Mirror[]; prisms: Prism[]; attenuators: Attenuator[]; target: Target; beamStart: Point }): boolean {
  for (const em of existing.mirrors) {
    const [e1, e2] = getMirrorEndpoints(em);
    if (segmentCircleIntersect(e1, e2, att.position, att.radius)) return true;
  }
  for (const prism of existing.prisms) {
    const pR = prism.sideLength / Math.sqrt(3);
    if (circlesOverlap(att.position, att.radius, prism.position, pR)) return true;
  }
  for (const ea of existing.attenuators) {
    if (circlesOverlap(att.position, att.radius, ea.position, ea.radius)) return true;
  }
  if (circlesOverlap(att.position, att.radius, existing.target.position, existing.target.radius)) return true;
  if (circlesOverlap(att.position, att.radius, existing.beamStart, 40)) return true;
  return false;
}

export default function generateLevel(difficulty: number): LevelData {
  const beamStart: Point = { x: 40, y: 40 };
  const beamAngle = 25 + Math.random() * 40;

  const target: Target = {
    position: { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT - 50 },
    radius: 20,
    hit: false,
  };

  const mirrors: Mirror[] = [];
  const prisms: Prism[] = [];
  const attenuators: Attenuator[] = [];

  const existing = { mirrors, prisms, attenuators, target, beamStart };

  const mirrorCount = Math.min(2 + Math.floor(difficulty / 2), 5);
  for (let i = 0; i < mirrorCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const mirror: Mirror = {
        id: uuidv4(),
        position: {
          x: 100 + Math.random() * (CANVAS_WIDTH - 200),
          y: 100 + Math.random() * (CANVAS_HEIGHT - 200),
        },
        angle: Math.random() * 180,
        length: 40,
      };
      if (!mirrorOverlapsExisting(mirror, existing)) {
        mirrors.push(mirror);
        break;
      }
      attempts++;
    }
  }

  const prismCount = Math.min(Math.floor(difficulty / 3), 2);
  for (let i = 0; i < prismCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const prism: Prism = {
        id: uuidv4(),
        position: {
          x: 150 + Math.random() * (CANVAS_WIDTH - 300),
          y: 150 + Math.random() * (CANVAS_HEIGHT - 300),
        },
        rotation: Math.random() * 360,
        sideLength: 50,
      };
      if (!prismOverlapsExisting(prism, existing)) {
        prisms.push(prism);
        break;
      }
      attempts++;
    }
  }

  let attAttempts = 0;
  while (attAttempts < 50) {
    const attenuator: Attenuator = {
      id: uuidv4(),
      position: {
        x: 150 + Math.random() * (CANVAS_WIDTH - 300),
        y: 150 + Math.random() * (CANVAS_HEIGHT - 300),
      },
      radius: 30,
    };
    if (!attenuatorOverlapsExisting(attenuator, existing)) {
      attenuators.push(attenuator);
      break;
    }
    attAttempts++;
  }

  return {
    gridSize: GRID_SIZE,
    mirrors,
    prisms,
    attenuators,
    target,
    beamStart,
    beamAngle,
  };
}
