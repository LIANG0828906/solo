export interface Asteroid {
  id: number;
  radius: number;
  orbitRadius: number;
  angle: number;
  angularVelocity: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  vertices: number[];
  x: number;
  y: number;
}

export interface Ore {
  id: number;
  x: number;
  y: number;
  color: string;
  colorType: 'red' | 'yellow' | 'green' | 'blue';
  size: number;
  isAttracted: boolean;
  angle: number;
}

export interface Meteor {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Ship {
  x: number;
  y: number;
  angle: number;
  velocity: { x: number; y: number };
  shield: number;
  maxShield: number;
  gravityRadius: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export interface GameState {
  ship: Ship;
  asteroids: Asteroid[];
  ores: Ore[];
  meteors: Meteor[];
  particles: Particle[];
  stars: Star[];
  score: number;
  timeRemaining: number;
  isGameOver: boolean;
  isPaused: boolean;
  oreCounts: { red: number; yellow: number; green: number; blue: number };
  canvasWidth: number;
  canvasHeight: number;
}

export interface Keys {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
}

const ORE_COLORS: { color: string; type: 'red' | 'yellow' | 'green' | 'blue' }[] = [
  { color: '#FF6B6B', type: 'red' },
  { color: '#FFD93D', type: 'yellow' },
  { color: '#6BCB77', type: 'green' },
  { color: '#4D96FF', type: 'blue' },
];

const ASTEROID_COLORS = ['#5A4A3A', '#6B5A4A', '#7B6D5A', '#8B7D6B', '#6A5A4A'];

export function createStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
  return stars;
}

function generateAsteroidVertices(size: number): number[] {
  const vertices: number[] = [];
  const sides = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = size * (0.7 + Math.random() * 0.6);
    vertices.push(angle, r);
  }
  return vertices;
}

export function createAsteroid(
  id: number,
  centerX: number,
  centerY: number
): Asteroid {
  const orbitRadius = 100 + Math.random() * 180;
  const size = 15 + Math.random() * 25;
  const angle = Math.random() * Math.PI * 2;
  const angularVelocity = (0.002 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1);
  
  return {
    id,
    radius: size,
    orbitRadius,
    angle,
    angularVelocity,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    size,
    color: ASTEROID_COLORS[Math.floor(Math.random() * ASTEROID_COLORS.length)],
    vertices: generateAsteroidVertices(size),
    x: centerX + Math.cos(angle) * orbitRadius,
    y: centerY + Math.sin(angle) * orbitRadius,
  };
}

export function createAsteroids(
  count: number,
  centerX: number,
  centerY: number
): Asteroid[] {
  const asteroids: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    asteroids.push(createAsteroid(i, centerX, centerY));
  }
  return asteroids;
}

export function createOre(
  id: number,
  centerX: number,
  centerY: number,
  minOrbit: number,
  maxOrbit: number
): Ore {
  const orbitRadius = minOrbit + Math.random() * (maxOrbit - minOrbit);
  const angle = Math.random() * Math.PI * 2;
  const colorInfo = ORE_COLORS[Math.floor(Math.random() * ORE_COLORS.length)];
  
  return {
    id,
    x: centerX + Math.cos(angle) * orbitRadius,
    y: centerY + Math.sin(angle) * orbitRadius,
    color: colorInfo.color,
    colorType: colorInfo.type,
    size: 8,
    isAttracted: false,
    angle: Math.random() * Math.PI * 2,
  };
}

export function createOres(
  startId: number,
  count: number,
  centerX: number,
  centerY: number
): Ore[] {
  const ores: Ore[] = [];
  for (let i = 0; i < count; i++) {
    ores.push(createOre(startId + i, centerX, centerY, 80, 300));
  }
  return ores;
}

export function createMeteor(
  id: number,
  centerX: number,
  centerY: number
): Meteor {
  const angle = Math.random() * Math.PI * 2;
  const startDistance = 350;
  const speed = 8;
  
  return {
    id,
    x: centerX + Math.cos(angle) * startDistance,
    y: centerY + Math.sin(angle) * startDistance,
    vx: -Math.cos(angle) * speed,
    vy: -Math.sin(angle) * speed,
    radius: 15 + Math.random() * 5,
  };
}

export function createParticle(
  x: number,
  y: number,
  color: string
): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 3;
  
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color,
    life: 1,
    maxLife: 30 + Math.random() * 20,
    size: 2 + Math.random() * 3,
  };
}

export function createParticles(x: number, y: number, color: string, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, color));
  }
  return particles;
}

export function updateShip(
  ship: Ship,
  keys: Keys,
  canvasWidth: number,
  canvasHeight: number,
  deltaTime: number
): Ship {
  const speed = 5;
  let newShip = { ...ship };
  
  let dx = 0;
  let dy = 0;
  
  if (keys.ArrowUp) dy -= 1;
  if (keys.ArrowDown) dy += 1;
  if (keys.ArrowLeft) dx -= 1;
  if (keys.ArrowRight) dx += 1;
  
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    newShip.x += dx * speed;
    newShip.y += dy * speed;
    newShip.angle = Math.atan2(dy, dx) + Math.PI / 2;
  }
  
  const margin = 20;
  newShip.x = Math.max(margin, Math.min(canvasWidth - margin, newShip.x));
  newShip.y = Math.max(margin, Math.min(canvasHeight - margin, newShip.y));
  
  return newShip;
}

export function updateAsteroids(
  asteroids: Asteroid[],
  centerX: number,
  centerY: number
): Asteroid[] {
  return asteroids.map((asteroid) => {
    const newAngle = asteroid.angle + asteroid.angularVelocity;
    const newRotation = asteroid.rotation + asteroid.rotationSpeed;
    
    return {
      ...asteroid,
      angle: newAngle,
      rotation: newRotation,
      x: centerX + Math.cos(newAngle) * asteroid.orbitRadius,
      y: centerY + Math.sin(newAngle) * asteroid.orbitRadius,
    };
  });
}

export function updateOres(ores: Ore[], ship: Ship): {
  ores: Ore[];
  collectedOres: Ore[];
} {
  const collectedOres: Ore[] = [];
  
  const updatedOres = ores.map((ore) => {
    const dx = ship.x - ore.x;
    const dy = ship.y - ore.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < ship.gravityRadius) {
      if (dist < 20) {
        collectedOres.push(ore);
        return null;
      }
      
      const attractSpeed = 6;
      const nx = dx / dist;
      const ny = dy / dist;
      
      return {
        ...ore,
        x: ore.x + nx * attractSpeed,
        y: ore.y + ny * attractSpeed,
        isAttracted: true,
        angle: ore.angle + 0.1,
      };
    }
    
    return {
      ...ore,
      angle: ore.angle + 0.02,
    };
  }).filter((ore): ore is Ore => ore !== null);
  
  return { ores: updatedOres, collectedOres };
}

export function updateMeteors(
  meteors: Meteor[],
  centerX: number,
  centerY: number
): Meteor[] {
  return meteors
    .map((meteor) => ({
      ...meteor,
      x: meteor.x + meteor.vx,
      y: meteor.y + meteor.vy,
    }))
    .filter((meteor) => {
      const dx = meteor.x - centerX;
      const dy = meteor.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 400;
    });
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      life: p.life - 1 / p.maxLife,
      vx: p.vx * 0.98,
      vy: p.vy * 0.98,
    }))
    .filter((p) => p.life > 0);
}

export function checkShipMeteorCollision(ship: Ship, meteors: Meteor[]): boolean {
  const shipRadius = 15;
  
  for (const meteor of meteors) {
    const dx = ship.x - meteor.x;
    const dy = ship.y - meteor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < shipRadius + meteor.radius) {
      return true;
    }
  }
  
  return false;
}

export function getOreScore(colorType: string): number {
  switch (colorType) {
    case 'red': return 10;
    case 'yellow': return 15;
    case 'green': return 20;
    case 'blue': return 30;
    default: return 10;
  }
}
