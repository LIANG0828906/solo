import { v4 as uuidv4 } from 'uuid';

export interface AsteroidVertex {
  x: number;
  y: number;
}

export interface AsteroidLayer {
  radiusFactor: number;
  offsetX: number;
  offsetY: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  radius: number;
  vertices: AsteroidVertex[];
  layers: AsteroidLayer[];
  mineralType: 'normal' | 'rare';
  rotation: number;
  rotationSpeed: number;
  mineTime: number;
  maxMineTime: number;
  isNear: boolean;
  highlightPhase: number;
  alive: boolean;
}

function generateVertices(radius: number, count: number): AsteroidVertex[] {
  const vertices: AsteroidVertex[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.6);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
}

function generateLayers(): AsteroidLayer[] {
  const layers: AsteroidLayer[] = [];
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    layers.push({
      radiusFactor: 0.3 + (i / count) * 0.5,
      offsetX: (Math.random() - 0.5) * 0.2,
      offsetY: (Math.random() - 0.5) * 0.2,
    });
  }
  return layers;
}

export function generateAsteroidField(width: number, height: number): Asteroid[] {
  const count = 20 + Math.floor(Math.random() * 11);
  const asteroids: Asteroid[] = [];
  const margin = 100;

  for (let i = 0; i < count; i++) {
    const radius = 25 + Math.random() * 35;
    const x = margin + Math.random() * (width - margin * 2);
    const y = margin + Math.random() * (height - margin * 2);
    const isRare = Math.random() < 0.2;

    asteroids.push({
      id: uuidv4(),
      x,
      y,
      radius,
      vertices: generateVertices(radius, 8 + Math.floor(Math.random() * 5)),
      layers: generateLayers(),
      mineralType: isRare ? 'rare' : 'normal',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      mineTime: 0,
      maxMineTime: 0.5,
      isNear: false,
      highlightPhase: Math.random() * Math.PI * 2,
      alive: true,
    });
  }

  return asteroids;
}

export function updateAsteroids(
  asteroids: Asteroid[],
  shipX: number,
  shipY: number,
  dt: number
): Asteroid[] {
  const proximityRange = 150;

  return asteroids.map((a) => {
    if (!a.alive) return a;
    const dx = a.x - shipX;
    const dy = a.y - shipY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isNear = dist < proximityRange;

    const rotationSpeed = isNear ? a.rotationSpeed * 3 : a.rotationSpeed;

    return {
      ...a,
      rotation: a.rotation + rotationSpeed * dt,
      isNear,
      highlightPhase: a.highlightPhase + dt * 3,
    };
  });
}
