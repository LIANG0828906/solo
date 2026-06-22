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
  accumulatedTime: number;
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

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Point, s: number): Point {
  return { x: v.x * s, y: v.y * s };
}

function length(v: Point): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v: Point): Point {
  const len = length(v);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
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

function getEdgeNormal(v1: Point, v2: Point, center: Point): Point {
  const edge = subtract(v2, v1);
  const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
  let normal = { x: -edge.y, y: edge.x };
  normal = normalize(normal);
  const toCenter = subtract(center, mid);
  if (dot(normal, toCenter) > 0) {
    normal = scale(normal, -1);
  }
  return normal;
}

function raySegmentIntersection(
  origin: Point, dir: Point, v1: Point, v2: Point
): { point: Point; t: number } | null {
  const v1v2 = subtract(v2, v1);
  const denom = dir.x * v1v2.y - dir.y * v1v2.x;
  if (Math.abs(denom) < 0.0001) return null;
  const diff = subtract(v1, origin);
  const t = (diff.x * v1v2.y - diff.y * v1v2.x) / denom;
  const u = (diff.x * dir.y - diff.y * dir.x) / denom;
  if (t > 0.001 && u >= 0 && u <= 1) {
    return {
      point: add(origin, scale(dir, t)),
      t
    };
  }
  return null;
}

function rayPolygonIntersection(
  start: Point, direction: number, vertices: Point[], maxDist: number
): { point: Point; normal: Point; t: number } | null {
  const dir = { x: Math.cos(direction), y: Math.sin(direction) };
  let closest: { point: Point; normal: Point; t: number } | null = null;
  const center = {
    x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
    y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
  };
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const result = raySegmentIntersection(start, dir, v1, v2);
    if (result && result.t * length(dir) <= maxDist) {
      if (!closest || result.t < closest.t) {
        const normal = getEdgeNormal(v1, v2, center);
        closest = { point: result.point, normal, t: result.t };
      }
    }
  }
  return closest;
}

function snellRefract(
  incidentDir: Point,
  normal: Point,
  n1: number,
  n2: number
): { direction: Point; reflected: boolean } {
  let n = normal;
  let cosTheta1 = -dot(incidentDir, n);
  if (cosTheta1 < 0) {
    n = scale(n, -1);
    cosTheta1 = -cosTheta1;
  }

  const sinTheta1Sq = 1 - cosTheta1 * cosTheta1;
  const ratio = n1 / n2;
  const sinTheta2Sq = ratio * ratio * sinTheta1Sq;

  if (sinTheta2Sq > 1) {
    const reflectedDir = add(incidentDir, scale(n, 2 * cosTheta1));
    return { direction: normalize(reflectedDir), reflected: true };
  }

  const cosTheta2 = Math.sqrt(1 - sinTheta2Sq);
  const term1 = scale(incidentDir, ratio);
  const term2 = scale(n, ratio * cosTheta1 - cosTheta2);
  const refractedDir = add(term1, term2);

  return { direction: normalize(refractedDir), reflected: false };
}

interface PrismTraceResult {
  entryPoint: Point;
  exitPoint: Point;
  exitDir: Point;
  internalSegments: { start: Point; end: Point }[];
}

function traceRayThroughPrism(
  rayStart: Point,
  rayDir: Point,
  prism: Prism,
  refractiveIndex: number
): PrismTraceResult | null {
  const vertices = getTriangleVertices(prism);
  const internalSegments: { start: Point; end: Point }[] = [];

  let entryHit: { point: Point; normal: Point; edgeIndex: number } | null = null;
  let minT = Infinity;

  for (let i = 0; i < 3; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 3];
    const hit = raySegmentIntersection(rayStart, rayDir, v1, v2);
    if (hit && hit.t < minT) {
      minT = hit.t;
      const normal = getEdgeNormal(v1, v2, prism.position);
      entryHit = { point: hit.point, normal, edgeIndex: i };
    }
  }

  if (!entryHit) return null;

  internalSegments.push({ start: rayStart, end: entryHit.point });

  const refractResult = snellRefract(
    rayDir, entryHit.normal, REFRACTIVE_INDEX_AIR, refractiveIndex
  );

  if (refractResult.reflected) {
    return null;
  }

  const internalDir = refractResult.direction;

  let exitHit: { point: Point; normal: Point } | null = null;
  minT = Infinity;

  for (let i = 0; i < 3; i++) {
    if (i === entryHit.edgeIndex) continue;
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 3];
    const hit = raySegmentIntersection(entryHit.point, internalDir, v1, v2);
    if (hit && hit.t > 0.001 && hit.t < minT) {
      minT = hit.t;
      const normal = getEdgeNormal(v1, v2, prism.position);
      exitHit = { point: hit.point, normal };
    }
  }

  if (!exitHit) return null;

  internalSegments.push({ start: entryHit.point, end: exitHit.point });

  const exitResult = snellRefract(
    internalDir,
    exitHit.normal,
    refractiveIndex,
    REFRACTIVE_INDEX_AIR
  );

  return {
    entryPoint: entryHit.point,
    exitPoint: exitHit.point,
    exitDir: exitResult.direction,
    internalSegments
  };
}

function diffuseReflect(incidentDir: Point, normal: Point): Point {
  let n = normal;
  if (dot(incidentDir, n) > 0) {
    n = scale(n, -1);
  }
  const randomAngle = (Math.random() - 0.5) * Math.PI * 0.8;
  const baseAngle = Math.atan2(n.y, n.x);
  const finalAngle = baseAngle + randomAngle;
  return { x: Math.cos(finalAngle), y: Math.sin(finalAngle) };
}

interface RayState {
  position: Point;
  direction: Point;
  color: string;
  intensity: number;
  remainingBounces: number;
  rayId: string;
  hasPassedPrism: boolean;
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
  const processedCrystalIds = new Set<string>();

  const initialDir = {
    x: Math.cos(lightSource.direction),
    y: Math.sin(lightSource.direction)
  };

  const initialRays: RayState[] = [{
    position: { ...lightSource.position },
    direction: initialDir,
    color: COLOR_WHITE,
    intensity: 1.0,
    remainingBounces: maxBounces,
    rayId: 'main-0',
    hasPassedPrism: false
  }];

  const queue: RayState[] = [...initialRays];

  while (queue.length > 0) {
    const ray = queue.shift()!;
    if (ray.intensity <= 0.05 || ray.remainingBounces < 0) continue;

    let closestHit: {
      type: 'prism' | 'obstacle' | 'crystal' | 'boundary';
      point: Point;
      distance: number;
      prism?: Prism;
      obstacle?: Obstacle;
      crystal?: Crystal;
      normal?: Point;
    } | null = null;

    const rayAngle = Math.atan2(ray.direction.y, ray.direction.x);

    if (!ray.hasPassedPrism) {
      for (const prism of prisms) {
        const vertices = getTriangleVertices(prism);
        let prismEntry: { point: Point; distance: number } | null = null;
        for (let i = 0; i < 3; i++) {
          const v1 = vertices[i];
          const v2 = vertices[(i + 1) % 3];
          const hit = raySegmentIntersection(ray.position, ray.direction, v1, v2);
          if (hit) {
            const dist = distance(ray.position, hit.point);
            if (dist > 0.1 && (!prismEntry || dist < prismEntry.distance)) {
              prismEntry = { point: hit.point, distance: dist };
            }
          }
        }
        if (prismEntry) {
          const dist = prismEntry.distance;
          if (!closestHit || dist < closestHit.distance) {
            closestHit = {
              type: 'prism',
              point: prismEntry.point,
              distance: dist,
              prism
            };
          }
        }
      }
    } else {
      for (const prism of prisms) {
        const vertices = getTriangleVertices(prism);
        const hit = rayPolygonIntersection(ray.position, rayAngle, vertices, maxDist);
        if (hit) {
          const dist = distance(ray.position, hit.point);
          if (dist > 0.1 && (!closestHit || dist < closestHit.distance)) {
            closestHit = {
              type: 'prism',
              point: hit.point,
              distance: dist,
              prism,
              normal: hit.normal
            };
          }
        }
      }
    }

    for (const obstacle of obstacles) {
      const vertices = getObstacleEdges(obstacle);
      const hit = rayPolygonIntersection(ray.position, rayAngle, vertices, maxDist);
      if (hit) {
        const dist = distance(ray.position, hit.point);
        if (dist > 0.1 && (!closestHit || dist < closestHit.distance)) {
          closestHit = {
            type: 'obstacle',
            point: hit.point,
            distance: dist,
            obstacle,
            normal: hit.normal
          };
        }
      }
    }

    for (const crystal of crystals) {
      const vertices = getHexagonVertices(crystal, crystalSize);
      const hit = rayPolygonIntersection(ray.position, rayAngle, vertices, maxDist);
      if (hit) {
        const dist = distance(ray.position, hit.point);
        if (dist > 0.1 && (!closestHit || dist < closestHit.distance)) {
          closestHit = {
            type: 'crystal',
            point: hit.point,
            distance: dist,
            crystal
          };
        }
      }
    }

    const boundaryPoints = [
      { x: 0, y: 0 }, { x: canvasWidth, y: 0 },
      { x: canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight }
    ];
    const boundaryHit = rayPolygonIntersection(ray.position, rayAngle, boundaryPoints, maxDist);
    if (boundaryHit) {
      const dist = distance(ray.position, boundaryHit.point);
      if (!closestHit || dist < closestHit.distance) {
        closestHit = {
          type: 'boundary', point: boundaryHit.point, distance: dist };
      }
    }

    if (!closestHit) {
      segments.push({
        start: { ...ray.position },
        end: {
          x: ray.position.x + ray.direction.x * maxDist,
          y: ray.position.y + ray.direction.y * maxDist
        },
        color: ray.color,
        intensity: ray.intensity,
        rayId: ray.rayId
      });
      continue;
    }

    if (closestHit.type === 'prism' && closestHit.prism && !ray.hasPassedPrism) {
      const prism = closestHit.prism;
      const colors = [
        { color: COLOR_RED, n: REFRACTIVE_INDEX_RED },
        { color: COLOR_GREEN, n: REFRACTIVE_INDEX_GREEN },
        { color: COLOR_BLUE, n: REFRACTIVE_INDEX_BLUE }
      ];

      for (let i = 0; i < colors.length; i++) {
        const { color, n } = colors[i];
        const traceResult = traceRayThroughPrism(ray.position, ray.direction, prism, n);
        if (traceResult) {
          for (let j = 0; j < traceResult.internalSegments.length; j++) {
            segments.push({
              start: traceResult.internalSegments[j].start,
              end: traceResult.internalSegments[j].end,
              color: j === 0 ? ray.color : color,
              intensity: ray.intensity * 0.95,
              rayId: `${ray.rayId}-${i}`
            });
          }
          queue.push({
            position: traceResult.exitPoint,
            direction: traceResult.exitDir,
            color: color,
            intensity: ray.intensity * 0.9,
            remainingBounces: ray.remainingBounces,
            rayId: `${ray.rayId}-${i}`,
            hasPassedPrism: true
          });
        }
      }
    } else if (closestHit.type === 'crystal' && closestHit.crystal) {
      segments.push({
        start: { ...ray.position },
        end: { ...closestHit.point },
        color: ray.color,
        intensity: ray.intensity,
        rayId: ray.rayId
      });
      if (!processedCrystalIds.has(closestHit.crystal.id)) {
        hitCrystals.push({
          crystalId: closestHit.crystal.id,
          color: ray.color,
          intensity: ray.intensity
        });
        processedCrystalIds.add(closestHit.crystal.id);
      }
    } else if (closestHit.type === 'obstacle' && closestHit.obstacle && closestHit.normal) {
      segments.push({
        start: { ...ray.position },
        end: { ...closestHit.point },
        color: ray.color,
        intensity: ray.intensity,
        rayId: ray.rayId
      });
      const reflectedDir = diffuseReflect(ray.direction, closestHit.normal);
      queue.push({
        position: { ...closestHit.point },
        direction: reflectedDir,
        color: ray.color,
        intensity: ray.intensity * 0.5,
        remainingBounces: ray.remainingBounces - 1,
        rayId: `${ray.rayId}-d`,
        hasPassedPrism: ray.hasPassedPrism
      });
    } else if (closestHit.type === 'prism' && closestHit.prism && closestHit.normal && ray.hasPassedPrism) {
      segments.push({
        start: { ...ray.position },
        end: { ...closestHit.point },
        color: ray.color,
        intensity: ray.intensity,
        rayId: ray.rayId
      });
      const reflectedDir = add(ray.direction, scale(closestHit.normal, -2 * dot(ray.direction, closestHit.normal)));
      queue.push({
        position: { ...closestHit.point },
        direction: normalize(reflectedDir),
        color: ray.color,
        intensity: ray.intensity * 0.9,
        remainingBounces: ray.remainingBounces - 1,
        rayId: `${ray.rayId}-r`,
        hasPassedPrism: true
      });
    } else {
      segments.push({
        start: { ...ray.position },
        end: { ...closestHit.point },
        color: ray.color,
        intensity: ray.intensity,
        rayId: ray.rayId
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
