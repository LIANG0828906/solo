import type { 
  GridCoord, 
  PixelCoord, 
  OpticalElement, 
  LaserSegment, 
  LaserResult, 
  ParticleEffect 
} from './types';
import { GRID_SIZE, CELL_SIZE, COLORS } from './types';

interface Ray {
  position: PixelCoord;
  angle: number;
  intensity: number;
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

function getInitialAngle(player: 'playerA' | 'playerB'): number {
  return player === 'playerA' ? -Math.PI / 2 : Math.PI / 2;
}

function reflectMirror(angle: number, orientation: 'nw-se' | 'ne-sw'): number {
  if (orientation === 'nw-se') {
    return -angle + Math.PI / 2;
  } else {
    return -angle - Math.PI / 2;
  }
}

function splitPrism(angle: number): [number, number] {
  const splitAngle = (60 * Math.PI) / 180;
  return [angle - splitAngle, angle + splitAngle];
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
  const dx = Math.cos(startRay.angle);
  const dy = Math.sin(startRay.angle);
  const stepSize = 2;
  const maxSteps = maxDistance / stepSize;
  
  let currentPos = { ...startRay.position };
  let lastGrid = pixelToGrid(currentPos);
  
  for (let step = 0; step < maxSteps; step++) {
    currentPos = {
      x: currentPos.x + dx * stepSize,
      y: currentPos.y + dy * stepSize
    };
    
    const baseA = getBasePosition('playerA');
    const baseB = getBasePosition('playerB');
    
    if (Math.hypot(currentPos.x - baseA.x, currentPos.y - baseA.y) < 20) {
      return {
        endPoint: { ...baseA },
        hitElement: null,
        hitBase: 'playerA',
        outOfBounds: false
      };
    }
    
    if (Math.hypot(currentPos.x - baseB.x, currentPos.y - baseB.y) < 20) {
      return {
        endPoint: { ...baseB },
        hitElement: null,
        hitBase: 'playerB',
        outOfBounds: false
      };
    }
    
    if (currentPos.x < -50 || currentPos.x > BOARD_SIZE_PX + 50 ||
        currentPos.y < -50 || currentPos.y > BOARD_SIZE_PX + 50) {
      return {
        endPoint: { ...currentPos },
        hitElement: null,
        hitBase: null,
        outOfBounds: true
      };
    }
    
    const currentGrid = pixelToGrid(currentPos);
    const gridChanged = currentGrid.x !== lastGrid.x || currentGrid.y !== lastGrid.y;
    
    if (gridChanged && isInBounds(currentGrid)) {
      const element = getElementAt(currentGrid, elements);
      if (element) {
        const elementCenter = gridToPixel(element.position);
        return {
          endPoint: { ...elementCenter },
          hitElement: element,
          hitBase: null,
          outOfBounds: false
        };
      }
    }
    
    lastGrid = currentGrid;
  }
  
  return {
    endPoint: { ...currentPos },
    hitElement: null,
    hitBase: null,
    outOfBounds: true
  };
}

const BOARD_SIZE_PX = GRID_SIZE * CELL_SIZE;

function traceRays(
  startRay: Ray,
  elements: OpticalElement[],
  maxRays: number = 50
): { segments: LaserSegment[]; hitBase: 'playerA' | 'playerB' | null; particles: ParticleEffect[] } {
  const segments: LaserSegment[] = [];
  const particles: ParticleEffect[] = [];
  const rays: Ray[] = [{ ...startRay }];
  let hitBase: 'playerA' | 'playerB' | null = null;
  const visited = new Set<string>();
  
  while (rays.length > 0 && segments.length < maxRays) {
    const ray = rays.shift()!;
    const key = `${ray.position.x.toFixed(1)},${ray.position.y.toFixed(1)},${ray.angle.toFixed(3)}`;
    
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
      const newAngle = reflectMirror(ray.angle, element.orientation);
      rays.push({
        position: { ...result.endPoint },
        angle: newAngle,
        intensity: ray.intensity * 0.95
      });
    } else if (element.type === 'prism') {
      const [angle1, angle2] = splitPrism(ray.angle);
      const newIntensity = ray.intensity * 0.7;
      rays.push({
        position: { ...result.endPoint },
        angle: angle1,
        intensity: newIntensity
      });
      rays.push({
        position: { ...result.endPoint },
        angle: angle2,
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
  const initialAngle = getInitialAngle(firingPlayer);
  
  const initialRay: Ray = {
    position: startPos,
    angle: initialAngle,
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

  return {
    segments,
    hitBase,
    hitPosition,
    particles
  };
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

export { gridToPixel, pixelToGrid };
