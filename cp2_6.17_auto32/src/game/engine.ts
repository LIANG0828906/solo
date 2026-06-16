import type { 
  GridCoord, 
  PixelCoord, 
  OpticalElement, 
  LaserSegment, 
  LaserResult, 
  ParticleEffect 
} from './types';
import { GRID_SIZE, CELL_SIZE, COLORS } from './types';

interface Vec2 {
  x: number;
  y: number;
}

interface Ray {
  position: PixelCoord;
  direction: Vec2;
  intensity: number;
}

const MIRROR_NORMALS: Record<string, Vec2> = {
  'nw-se': { x: 1, y: -1 },
  'ne-sw': { x: -1, y: -1 }
};

const PRISM_NORMALS: Record<string, Vec2> = {
  'default-left': { x: -0.5, y: -0.866 },
  'default-right': { x: 0.5, y: -0.866 }
};

function vecNormalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-10) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function vecDot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function vecScale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function vecAdd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function vecSub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function reflectVector(incident: Vec2, normal: Vec2): Vec2 {
  const n = vecNormalize(normal);
  const d = vecDot(incident, n);
  return vecSub(incident, vecScale(n, 2 * d));
}

function rotateVector(v: Vec2, angleRad: number): Vec2 {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos
  };
}

function reflectMirror(incidentDir: Vec2, orientation: 'nw-se' | 'ne-sw'): Vec2 {
  const normal = vecNormalize(MIRROR_NORMALS[orientation]);
  const dot = vecDot(incidentDir, normal);
  const usedNormal = dot < 0 ? normal : vecScale(normal, -1);
  const result = reflectVector(incidentDir, usedNormal);
  return vecNormalize(result);
}

function splitPrism(incidentDir: Vec2): [Vec2, Vec2] {
  const splitAngle = (60 * Math.PI) / 180;
  const dir1 = vecNormalize(rotateVector(incidentDir, splitAngle));
  const dir2 = vecNormalize(rotateVector(incidentDir, -splitAngle));
  return [dir1, dir2];
}

function gridToPixel(grid: GridCoord, center = true): PixelCoord {
  return {
    x: grid.x * CELL_SIZE + (center ? CELL_SIZE / 2 : 0),
    y: grid.y * CELL_SIZE + (center ? CELL_SIZE / 2 : 0)
  };
}

function pixelToGrid(pixel: PixelCoord): GridCoord {
  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(pixel.x / CELL_SIZE))),
    y: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(pixel.y / CELL_SIZE)))
  };
}

function isInBounds(coord: GridCoord): boolean {
  return coord.x >= 0 && coord.x < GRID_SIZE && coord.y >= 0 && coord.y < GRID_SIZE;
}

function getElementAt(grid: GridCoord, elements: OpticalElement[]): OpticalElement | undefined {
  return elements.find(e => e.position.x === grid.x && e.position.y === grid.y);
}

function getBasePosition(player: 'playerA' | 'playerB'): PixelCoord {
  if (player === 'playerA') {
    return gridToPixel({ x: 0, y: 7 });
  } else {
    return gridToPixel({ x: 7, y: 0 });
  }
}

function getLaserStartPosition(player: 'playerA' | 'playerB'): PixelCoord {
  const base = getBasePosition(player);
  if (player === 'playerA') {
    return { x: base.x, y: base.y - CELL_SIZE / 2 };
  } else {
    return { x: base.x, y: base.y + CELL_SIZE / 2 };
  }
}

function getInitialDirection(player: 'playerA' | 'playerB'): Vec2 {
  return player === 'playerA' ? { x: 0, y: -1 } : { x: 0, y: 1 };
}

function createParticle(position: PixelCoord): ParticleEffect {
  return {
    id: `particle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position: { ...position },
    color: COLORS.particle,
    createdAt: Date.now(),
    duration: 500
  };
}

const BOARD_SIZE_PX = GRID_SIZE * CELL_SIZE;

interface RayTraceResult {
  endPoint: PixelCoord;
  hitElement: OpticalElement | null;
  hitBase: 'playerA' | 'playerB' | null;
  outOfBounds: boolean;
}

function traceRaySegment(
  startRay: Ray,
  elements: OpticalElement[],
  maxDistance: number = 2000
): RayTraceResult {
  const dir = vecNormalize(startRay.direction);
  const stepSize = 2;
  const maxSteps = maxDistance / stepSize;
  
  let currentPos = { ...startRay.position };
  let lastGrid = pixelToGrid(currentPos);
  
  for (let step = 0; step < maxSteps; step++) {
    currentPos = {
      x: currentPos.x + dir.x * stepSize,
      y: currentPos.y + dir.y * stepSize
    };
    
    const baseA = getBasePosition('playerA');
    const baseB = getBasePosition('playerB');
    
    if (Math.hypot(currentPos.x - baseA.x, currentPos.y - baseA.y) < 20) {
      return { endPoint: { ...baseA }, hitElement: null, hitBase: 'playerA', outOfBounds: false };
    }
    
    if (Math.hypot(currentPos.x - baseB.x, currentPos.y - baseB.y) < 20) {
      return { endPoint: { ...baseB }, hitElement: null, hitBase: 'playerB', outOfBounds: false };
    }
    
    if (currentPos.x < -50 || currentPos.x > BOARD_SIZE_PX + 50 ||
        currentPos.y < -50 || currentPos.y > BOARD_SIZE_PX + 50) {
      return { endPoint: { ...currentPos }, hitElement: null, hitBase: null, outOfBounds: true };
    }
    
    const currentGrid = pixelToGrid(currentPos);
    const gridChanged = currentGrid.x !== lastGrid.x || currentGrid.y !== lastGrid.y;
    
    if (gridChanged && isInBounds(currentGrid)) {
      const element = getElementAt(currentGrid, elements);
      if (element) {
        const elementCenter = gridToPixel(element.position);
        return { endPoint: { ...elementCenter }, hitElement: element, hitBase: null, outOfBounds: false };
      }
    }
    
    lastGrid = currentGrid;
  }
  
  return { endPoint: { ...currentPos }, hitElement: null, hitBase: null, outOfBounds: true };
}

function traceRays(
  startRay: Ray,
  elements: OpticalElement[],
  maxRays: number = 50
): { segments: LaserSegment[]; hitBase: 'playerA' | 'playerB' | null; particles: ParticleEffect[] } {
  const segments: LaserSegment[] = [];
  const particles: ParticleEffect[] = [];
  const rays: Ray[] = [{ ...startRay, direction: { ...startRay.direction } }];
  let hitBase: 'playerA' | 'playerB' | null = null;
  const visited = new Set<string>();
  
  while (rays.length > 0 && segments.length < maxRays) {
    const ray = rays.shift()!;
    const posKey = `${ray.position.x.toFixed(1)},${ray.position.y.toFixed(1)}`;
    const dirKey = `${ray.direction.x.toFixed(3)},${ray.direction.y.toFixed(3)}`;
    const key = `${posKey}|${dirKey}`;
    
    if (visited.has(key)) continue;
    if (rays.length > 20) break;
    visited.add(key);
    
    const result = traceRaySegment(ray, elements);
    
    segments.push({
      start: { ...ray.position },
      end: { ...result.endPoint },
      intensity: ray.intensity
    });
    
    if (result.hitBase) {
      hitBase = result.hitBase;
      continue;
    }
    
    if (result.outOfBounds || !result.hitElement) {
      continue;
    }
    
    const element = result.hitElement;
    
    if (element.type === 'mirror' && element.orientation) {
      const newDir = reflectMirror(vecNormalize(ray.direction), element.orientation);
      rays.push({
        position: { ...result.endPoint },
        direction: newDir,
        intensity: ray.intensity * 0.95
      });
    } else if (element.type === 'prism') {
      const [dir1, dir2] = splitPrism(vecNormalize(ray.direction));
      const newIntensity = ray.intensity * 0.7;
      rays.push({
        position: { ...result.endPoint },
        direction: dir1,
        intensity: newIntensity
      });
      rays.push({
        position: { ...result.endPoint },
        direction: dir2,
        intensity: newIntensity
      });
    } else if (element.type === 'blocker') {
      particles.push(createParticle(result.endPoint));
    }
  }
  
  return { segments, hitBase, particles };
}

export function simulateLaser(
  firingPlayer: 'playerA' | 'playerB',
  elements: OpticalElement[]
): LaserResult {
  const startTime = performance.now();
  
  const startPos = getLaserStartPosition(firingPlayer);
  const initialDir = getInitialDirection(firingPlayer);
  
  const initialRay: Ray = {
    position: startPos,
    direction: initialDir,
    intensity: 1.0
  };

  const { segments, hitBase, particles } = traceRays(initialRay, elements);
  const hitPosition = hitBase ? getBasePosition(hitBase) : null;
  
  const elapsed = performance.now() - startTime;
  if (elapsed > 5) {
    console.warn(`Laser simulation took ${elapsed.toFixed(2)}ms - exceeded 5ms threshold`);
  } else {
    console.debug(`Laser simulation took ${elapsed.toFixed(2)}ms`);
  }

  return { segments, hitBase, hitPosition, particles };
}

export function getLaserStartPositions(): { playerA: PixelCoord; playerB: PixelCoord } {
  return {
    playerA: getLaserStartPosition('playerA'),
    playerB: getLaserStartPosition('playerB')
  };
}

export function getBasePositions(): { playerA: PixelCoord; playerB: PixelCoord } {
  return {
    playerA: getBasePosition('playerA'),
    playerB: getBasePosition('playerB')
  };
}

export { gridToPixel, pixelToGrid, reflectMirror, splitPrism };
