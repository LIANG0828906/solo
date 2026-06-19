import {
  Debris, DebrisType, OrbitZone, Ship, Vertex,
  CANVAS_WIDTH, CANVAS_HEIGHT, MIN_DEBRIS_COUNT, MAX_DEBRIS_COUNT,
  BEAM_LENGTH, BEAM_SPREAD,
} from './types';

let debrisIdCounter = 0;
let popupIdCounter = 0;

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generatePolygonVertices(size: number, vertexCount: number): Vertex[] {
  const vertices: Vertex[] = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const radius = size * (0.7 + Math.random() * 0.3);
    vertices.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return vertices;
}

export function createDebris(zone: OrbitZone): Debris {
  const types: DebrisType[] = ['metal', 'plastic', 'electronic'];
  const type = types[Math.floor(Math.random() * types.length)];
  const size = randomRange(zone.debrisSizeMin, zone.debrisSizeMax);
  const vertexCount = Math.floor(randomRange(4, 9));
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0, vx = 0, vy = 0;
  const speed = randomRange(zone.debrisSpeedMin, zone.debrisSpeedMax);

  switch (side) {
    case 0:
      x = Math.random() * CANVAS_WIDTH;
      y = -size;
      vx = randomRange(-speed, speed);
      vy = Math.abs(randomRange(speed * 0.3, speed));
      break;
    case 1:
      x = CANVAS_WIDTH + size;
      y = Math.random() * CANVAS_HEIGHT;
      vx = -Math.abs(randomRange(speed * 0.3, speed));
      vy = randomRange(-speed, speed);
      break;
    case 2:
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT + size;
      vx = randomRange(-speed, speed);
      vy = -Math.abs(randomRange(speed * 0.3, speed));
      break;
    default:
      x = -size;
      y = Math.random() * CANVAS_HEIGHT;
      vx = Math.abs(randomRange(speed * 0.3, speed));
      vy = randomRange(-speed, speed);
  }

  return {
    id: debrisIdCounter++,
    x, y, vx, vy,
    size,
    baseSize: size,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: randomRange(-0.02, 0.02),
    type,
    vertices: generatePolygonVertices(size, vertexCount),
    isBeingCaptured: false,
    captureProgress: 0,
  };
}

export function initializeDebris(zone: OrbitZone): Debris[] {
  const count = Math.floor(randomRange(MIN_DEBRIS_COUNT, MAX_DEBRIS_COUNT + 1));
  const debrisList: Debris[] = [];
  for (let i = 0; i < count; i++) {
    const d = createDebris(zone);
    d.x = randomRange(50, CANVAS_WIDTH - 50);
    d.y = randomRange(50, CANVAS_HEIGHT - 50);
    debrisList.push(d);
  }
  return debrisList;
}

export function isOutOfBounds(debris: Debris): boolean {
  const margin = debris.size + 20;
  return (
    debris.x < -margin ||
    debris.x > CANVAS_WIDTH + margin ||
    debris.y < -margin ||
    debris.y > CANVAS_HEIGHT + margin
  );
}

export function isPointInBeam(
  px: number, py: number, ship: Ship
): boolean {
  const dx = px - ship.x;
  const dy = py - ship.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > BEAM_LENGTH) return false;
  const angleToPoint = Math.atan2(dy, dx);
  let diff = angleToPoint - ship.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= BEAM_SPREAD / 2;
}

export function shouldMaintainDebrisCount(current: number): boolean {
  return current < MIN_DEBRIS_COUNT;
}

export function maybeSpawnDebris(current: number, zone: OrbitZone): Debris | null {
  if (current >= MAX_DEBRIS_COUNT) return null;
  if (current < MIN_DEBRIS_COUNT || Math.random() < 0.02) {
    return createDebris(zone);
  }
  return null;
}

export function allTasksCompleted(
  zone: OrbitZone, counts: Record<DebrisType, number>
): boolean {
  return zone.tasks.every(task => counts[task.type] >= task.count);
}

export function getNextPopupId(): number {
  return popupIdCounter++;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
