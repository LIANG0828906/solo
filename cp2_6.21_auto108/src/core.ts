export interface Point {
  x: number;
  y: number;
}

export interface Prism {
  id: string;
  position: Point;
  rotation: number;
  size: number;
}

export interface Crystal {
  id: string;
  position: Point;
  color: 'red' | 'green' | 'blue';
  isLit: boolean;
  litTime: number;
  requiredTime: number;
}

export interface Obstacle {
  id: string;
  position: Point;
  width: number;
  height: number;
  rotation: number;
}

export interface LightSource {
  position: Point;
  direction: number;
}

export interface LightSegment {
  start: Point;
  end: Point;
  color: string;
  intensity: number;
  rayId: string;
}

export interface HitInfo {
  crystalId: string;
  color: string;
  intensity: number;
}

export interface RefractionResult {
  segments: LightSegment[];
  hitCrystals: HitInfo[];
}

const REFRACTIVE_INDEX_AIR = 1.0;
const REFRACTIVE_INDEX_RED = 1.51;
const REFRACTIVE_INDEX_GREEN = 1.52;
const REFRACTIVE_INDEX_BLUE = 1.53;

const COLOR_RED = '#FF4500';
const COLOR_GREEN = '#32CD32';
const COLOR_BLUE = '#1E90FF';
const COLOR_WHITE = '#FFFFFF';

function normalizeAngle(angle: number): number {
  while (angle > Math.PI * 2) angle -= Math.PI * 2;
  while (angle < 0) angle += Math.PI * 2;
  return angle;
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getTriangleVertices(prism: Prism): Point[] {
  const { position, rotation, size } = prism;
  const vertices: Point[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = rotation + (i * Math.PI * 2) / 3 - Math.PI / 2;
    vertices.push({
      x: position.x + Math.cos(angle) * size,
      y: position.y + Math.sin(angle) * size,
    });
  }
  return vertices;
}

function getHexagonVertices(crystal: Crystal, size: number): Point[] {
  const { position } = crystal;
  const vertices: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    vertices.push({
      x: position.x + Math.cos(angle) * size,
      y: position.y + Math.sin(angle) * size,
    });
  }
  return vertices;
}

function getObstacleEdges(obstacle: Obstacle): Point[] {
  const { position, width, height, rotation } = obstacle;
  const hw = width / 2;
  const hh = height / 2;
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return corners.map((c) => ({
    x: position.x + c.x * Math.cos(rotation) - c.y * Math.sin(rotation),
    y: position.y + c.x * Math.sin(rotation) + c.y * Math.cos(rotation),
  }));
}

function lineIntersection(
  p1: Point, p2: Point, p3: Point, p4: Point
): { point: Point; t: number } | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null;
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;
  return {
    point: { x: p1.x + ua * (p2.x - p1.x), y: p1.y + ua * (p2.y - p1.y) },
    t: ua,
  };
}

function rayPolygonIntersection(
  start: Point, direction: number, vertices: Point[], maxDist: number
): { point: Point; normal: Point; t: number } | null {
  const end = {
    x: start.x + Math.cos(direction) * maxDist, y: start.y + Math.sin(direction) * maxDist };
  let closest: { point: Point; normal: Point; t: number } | null = null;
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const result = lineIntersection(start, end, v1, v2);
    if (result && (!closest || result.t < closest.t)) {
      const edge = { x: v2.x - v1.x, y: v2.y - v1.y };
      const len = Math.sqrt(edge.x ** 2 + edge.y ** 2);
      const normal = { x: -edge.y / len, y: edge.x / len };
      closest = { point: result.point, normal, t: result.t };
    }
  }
  return closest;
}

function snellRefraction(incidentAngle: number, normal: Point, n1: number, n2: number): number | null {
  const cosTheta1 = -Math.cos(incidentAngle);
  if (cosTheta1 < 0) return null;
  const sinTheta1 = Math.sin(incidentAngle);
  const sinTheta2 = (n1 / n2) * sinTheta1;
  if (Math.abs(sinTheta2) > 1) return null;
  const cosTheta2 = Math.sqrt(1 - sinTheta2 ** 2);
  return Math.atan2(sinTheta2, cosTheta2);
}

function reflect(direction: number, normal: Point): number {
  const dot = Math.cos(direction) * normal.x + Math.sin(direction) * normal.y;
  return direction - 2 * Math.acos(dot);
}

function diffuseReflect(normal: Point): number {
  const baseAngle = Math.atan2(normal.y, normal.x);
  const randomOffset = (Math.random() - 0.5) * Math.PI * 0.8;
  return baseAngle + randomOffset;
}

interface RayState {
  position: Point;
  direction: number;
  color: string;
  intensity: number;
  remainingBounces: number;
  rayId: string;
}

export function calcRefraction(
  prisms: Prism[],
  lightSource: LightSource,
  obstacles: Obstacle[],
  crystals: Crystal[],
  canvasWidth: number,
  canvasHeight: number
): RefractionResult {
  const segments: LightSegment[] = [];
  const hitCrystals: HitInfo[] = [];
  const maxDist = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2);
  const maxBounces = 3;
  const crystalSize = 12;
  const litCrystals = new Set<string>();

  const initialRays: RayState[] = [{
    position: { ...lightSource.position },
    direction: lightSource.direction,
    color: COLOR_WHITE,
    intensity: 1.0,
    remainingBounces: maxBounces,
    rayId: 'main-0',
  }];

  const queue: RayState[] = [...initialRays];

  while (queue.length > 0) {
    const ray = queue.shift()!;
    if (ray.intensity <= 0.05 || ray.remainingBounces < 0) continue;

    let closestHit: {
      type: 'prism' | 'obstacle' | 'crystal' | 'boundary';
      point: Point;
      normal: Point;
      distance: number;
      prism?: Prism;
      obstacle?: Obstacle;
      crystal?: Crystal;
      enterPrism?: boolean;
    } | null = null;

    for (const prism of prisms) {
      const vertices = getTriangleVertices(prism);
      const hit = rayPolygonIntersection(ray.position, ray.direction, vertices, maxDist);
      if (hit) {
        const dist = distance(ray.position, hit.point);
        if (dist > 0.1 && (!closestHit || dist < closestHit.distance)) {
          const centerDist = distance(hit.point, prism.position);
          const isEntering = centerDist < prism.size;
          closestHit = {
            type: 'prism', point: hit.point, normal: hit.normal, distance: dist, prism, enterPrism: isEntering };
        }
      }
    }

    for (const obstacle of obstacles) {
      const vertices = getObstacleEdges(obstacle);
      const hit = rayPolygonIntersection(ray.position, ray.direction, vertices, maxDist);
      if (hit) {
        const dist = distance(ray.position, hit.point);
        if (dist > 0.1 && (!closestHit || dist < closestHit.distance)) {
          closestHit = { type: 'obstacle', point: hit.point, normal: hit.normal, distance: dist, obstacle };
        }
      }
    }

    for (const crystal of crystals) {
      const vertices = getHexagonVertices(crystal, crystalSize);
      const hit = rayPolygonIntersection(ray.position, ray.direction, vertices, maxDist);
      if (hit) {
        const dist = distance(ray.position, hit.point);
        if (dist > 0.1 && (!closestHit || dist < closestHit.distance)) {
          closestHit = { type: 'crystal', point: hit.point, normal: hit.normal, distance: dist, crystal };
        }
      }
    }

    const boundaryPoints = [
      { x: 0, y: 0 }, { x: canvasWidth, y: 0 },
      { x: canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight },
    ];
    const boundaryHit = rayPolygonIntersection(ray.position, ray.direction, boundaryPoints, maxDist);
    if (boundaryHit) {
      const dist = distance(ray.position, boundaryHit.point);
      if (!closestHit || dist < closestHit.distance) {
        closestHit = { type: 'boundary', point: boundaryHit.point, normal: boundaryHit.normal, distance: dist };
      }
    }

    if (!closestHit) {
      segments.push({
        start: { ...ray.position },
        end: {
          x: ray.position.x + Math.cos(ray.direction) * maxDist,
          y: ray.position.y + Math.sin(ray.direction) * maxDist,
        },
        color: ray.color,
        intensity: ray.intensity,
        rayId: ray.rayId,
      });
      continue;
    }

    segments.push({
      start: { ...ray.position },
      end: { ...closestHit.point },
      color: ray.color,
      intensity: ray.intensity,
      rayId: ray.rayId,
    });

    if (closestHit.type === 'crystal' && closestHit.crystal) {
      if (!litCrystals.has(closestHit.crystal.id)) {
        hitCrystals.push({
          crystalId: closestHit.crystal.id,
          color: ray.color,
          intensity: ray.intensity,
        });
        litCrystals.add(closestHit.crystal.id);
      }
    } else if (closestHit.type === 'prism' && closestHit.prism) {
      const n1 = closestHit.enterPrism ? REFRACTIVE_INDEX_AIR : REFRACTIVE_INDEX_GREEN;
      const colors = [
        { color: COLOR_RED, n: REFRACTIVE_INDEX_RED },
        { color: COLOR_GREEN, n: REFRACTIVE_INDEX_GREEN },
        { color: COLOR_BLUE, n: REFRACTIVE_INDEX_BLUE },
      ];
      for (let i = 0; i < colors.length; i++) {
        const { color, n } = colors[i];
        const n2 = closestHit.enterPrism ? n : REFRACTIVE_INDEX_AIR;
        const refracted = snellRefraction(ray.direction, closestHit.normal, n1, n2);
        if (refracted !== null) {
          queue.push({
            position: { ...closestHit.point },
            direction: refracted,
            color: color,
            intensity: ray.intensity * 0.95,
            remainingBounces: ray.remainingBounces,
            rayId: `${ray.rayId}-${i}`,
          });
        } else {
          const reflected = reflect(ray.direction, closestHit.normal);
          queue.push({
            position: { ...closestHit.point },
            direction: reflected,
            color: color,
            intensity: ray.intensity * 0.9,
            remainingBounces: ray.remainingBounces - 1,
            rayId: `${ray.rayId}-${i}-r`,
          });
        }
      }
    } else if (closestHit.type === 'obstacle') {
      const reflected = diffuseReflect(closestHit.normal);
      queue.push({
        position: { ...closestHit.point },
        direction: reflected,
        color: ray.color,
        intensity: ray.intensity * 0.5,
        remainingBounces: ray.remainingBounces - 1,
        rayId: `${ray.rayId}-d`,
      });
    }
  }

  return { segments, hitCrystals };
}

export function getPrismAtPoint(prisms: Prism[], point: Point, size: number): Prism | null {
  for (const prism of prisms) {
    if (distance(prism.position, point) <= size * 1.2) {
      return prism;
    }
  }
  return null;
}

export function getRecommendedPath(
  level: { prisms: Prism[]; lightSource: LightSource; crystals: Crystal[] }
): { prismId: string; targetRotation: number }[] {
  const recommendations: { prismId: string; targetRotation: number }[] = [];
  for (const prism of level.prisms) {
    const targetCrystal = level.crystals[0];
    if (targetCrystal) {
      const dx = targetCrystal.position.x - prism.position.x;
      const dy = targetCrystal.position.y - prism.position.y;
      const targetAngle = Math.atan2(dy, dx);
      recommendations.push({ prismId: prism.id, targetRotation: targetAngle - level.lightSource.direction + Math.PI / 6 });
    }
  }
  return recommendations;
}
