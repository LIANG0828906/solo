import type { 
  GridCoord, 
  PixelCoord, 
  OpticalElement, 
  LaserSegment, 
  LaserResult, 
  ParticleEffect 
} from './types';
import { GRID_SIZE, CELL_SIZE, COLORS } from './types';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Ray {
  position: PixelCoord;
  direction: Direction;
  intensity: number;
}

const DIRECTION_VECTORS: Record<Direction, PixelCoord> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const MIRROR_REFLECTIONS: Record<string, Direction> = {
  'nw-se-up': 'right',
  'nw-se-right': 'up',
  'nw-se-down': 'left',
  'nw-se-left': 'down',
  'ne-sw-up': 'left',
  'ne-sw-left': 'up',
  'ne-sw-down': 'right',
  'ne-sw-right': 'down'
};

function gridToPixel(grid: GridCoord, center = true): PixelCoord {
  return {
    x: grid.x * CELL_SIZE + (center ? CELL_SIZE / 2 : 0),
    y: grid.y * CELL_SIZE + (center ? CELL_SIZE / 2 : 0)
  };
}

function pixelToGrid(pixel: PixelCoord): GridCoord {
  return {
    x: Math.floor(pixel.x / CELL_SIZE),
    y: Math.floor(pixel.y / CELL_SIZE)
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

function getInitialDirection(player: 'playerA' | 'playerB'): Direction {
  return player === 'playerA' ? 'up' : 'down';
}

function reflectDirection(direction: Direction, orientation: string): Direction {
  const key = `${orientation}-${direction}`;
  return MIRROR_REFLECTIONS[key] || direction;
}

function splitDirection(direction: Direction): [Direction, Direction] {
  const splits: Record<Direction, [Direction, Direction]> = {
    up: ['left', 'right'],
    down: ['left', 'right'],
    left: ['up', 'down'],
    right: ['up', 'down']
  };
  return splits[direction];
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

function traceRay(
  startRay: Ray,
  elements: OpticalElement[],
  maxSteps: number = 100
): { segments: LaserSegment[]; hitBase: 'playerA' | 'playerB' | null; particles: ParticleEffect[] } {
  const segments: LaserSegment[] = [];
  const particles: ParticleEffect[] = [];
  const rays: Ray[] = [{ ...startRay }];
  const visited = new Set<string>();
  let hitBase: 'playerA' | 'playerB' | null = null;

  while (rays.length > 0 && segments.length < maxSteps) {
    const ray = rays.shift()!;
    const key = `${ray.position.x},${ray.position.y},${ray.direction}`;
    
    if (visited.has(key)) continue;
    visited.add(key);

    const dir = DIRECTION_VECTORS[ray.direction];
    let currentPos = { ...ray.position };
    let hit = false;

    while (!hit) {
      const nextPos = {
        x: currentPos.x + dir.x * CELL_SIZE,
        y: currentPos.y + dir.y * CELL_SIZE
      };

      const nextGrid = pixelToGrid(nextPos);
      
      if (!isInBounds(nextGrid)) {
        segments.push({
          start: { ...ray.position },
          end: { ...nextPos },
          intensity: ray.intensity
        });
        break;
      }

      const baseA = getBasePosition('playerA');
      const baseB = getBasePosition('playerB');
      
      if (Math.hypot(nextPos.x - baseA.x, nextPos.y - baseA.y) < 20) {
        segments.push({
          start: { ...ray.position },
          end: { ...baseA },
          intensity: ray.intensity
        });
        hitBase = 'playerA';
        hit = true;
        break;
      }
      
      if (Math.hypot(nextPos.x - baseB.x, nextPos.y - baseB.y) < 20) {
        segments.push({
          start: { ...ray.position },
          end: { ...baseB },
          intensity: ray.intensity
        });
        hitBase = 'playerB';
        hit = true;
        break;
      }

      const element = getElementAt(nextGrid, elements);
      
      if (element) {
        const elementCenter = gridToPixel(element.position);
        
        segments.push({
          start: { ...ray.position },
          end: { ...elementCenter },
          intensity: ray.intensity
        });

        if (element.type === 'mirror' && element.orientation) {
          const newDir = reflectDirection(ray.direction, element.orientation);
          rays.push({
            position: { ...elementCenter },
            direction: newDir,
            intensity: ray.intensity
          });
        } else if (element.type === 'prism') {
          const [dir1, dir2] = splitDirection(ray.direction);
          const newIntensity = ray.intensity * 0.7;
          rays.push({
            position: { ...elementCenter },
            direction: dir1,
            intensity: newIntensity
          });
          rays.push({
            position: { ...elementCenter },
            direction: dir2,
            intensity: newIntensity
          });
        } else if (element.type === 'blocker') {
          particles.push(createParticle(elementCenter));
        }
        
        hit = true;
        break;
      }

      currentPos = nextPos;
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

  const { segments, hitBase, particles } = traceRay(initialRay, elements);
  
  const hitPosition = hitBase ? getBasePosition(hitBase) : null;
  
  const elapsed = performance.now() - startTime;
  console.debug(`Laser simulation took ${elapsed.toFixed(2)}ms`);

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
