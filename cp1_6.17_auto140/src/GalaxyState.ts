export interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'core' | 'disk' | 'halo';
}

export interface Galaxy {
  id: string;
  stars: Star[];
  centerX: number;
  centerY: number;
  vx: number;
  vy: number;
  starCount: number;
  armDensity: number;
  color: string;
  trail: { x: number; y: number }[];
}

export interface SupernovaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface CollisionEvent {
  x: number;
  y: number;
  time: number;
  haloOpacity: number;
  haloDuration: number;
}

export interface GalaxyState {
  galaxies: Galaxy[];
  supernovas: SupernovaParticle[];
  collisionEvents: CollisionEvent[];
  isColliding: boolean;
  totalStarCount: number;
  frameCount: number;
  history: { frame: number; centerX: number; centerY: number; starCount: number }[];
}

export function createStar(
  x: number,
  y: number,
  vx: number,
  vy: number,
  type: 'core' | 'disk' | 'halo'
): Star {
  return { x, y, vx, vy, type };
}

export function createGalaxy(
  id: string,
  centerX: number,
  centerY: number,
  vx: number,
  vy: number,
  starCount: number,
  armDensity: number,
  color: string
): Galaxy {
  const stars: Star[] = [];
  const coreCount = Math.floor(starCount * 0.2);
  const diskCount = starCount - coreCount;

  for (let i = 0; i < coreCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 20 + 5;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const speed = Math.sqrt(radius) * 0.15;
    const perpAngle = angle + Math.PI / 2;
    const vxStar = vx + Math.cos(perpAngle) * speed;
    const vyStar = vy + Math.sin(perpAngle) * speed;
    stars.push(createStar(x, y, vxStar, vyStar, 'core'));
  }

  const armCount = 2;
  for (let i = 0; i < diskCount; i++) {
    const armIndex = i % armCount;
    const armAngle = (armIndex / armCount) * Math.PI * 2;
    const t = Math.random();
    const radius = 30 + t * 80;
    const spiralAngle = armAngle + t * armDensity * Math.PI;
    const scatter = (Math.random() - 0.5) * 15;

    const x = centerX + Math.cos(spiralAngle) * radius + Math.cos(spiralAngle + Math.PI / 2) * scatter;
    const y = centerY + Math.sin(spiralAngle) * radius + Math.sin(spiralAngle + Math.PI / 2) * scatter;

    const speed = Math.sqrt(radius) * 0.25;
    const perpAngle = spiralAngle + Math.PI / 2;
    const vxStar = vx + Math.cos(perpAngle) * speed;
    const vyStar = vy + Math.sin(perpAngle) * speed;

    stars.push(createStar(x, y, vxStar, vyStar, 'disk'));
  }

  return {
    id,
    stars,
    centerX,
    centerY,
    vx,
    vy,
    starCount,
    armDensity,
    color,
    trail: []
  };
}

export function createInitialState(): GalaxyState {
  const galaxyA = createGalaxy(
    'galaxy-a',
    300,
    400,
    1.5,
    0,
    200,
    1.0,
    '#64B5F6'
  );
  const galaxyB = createGalaxy(
    'galaxy-b',
    900,
    400,
    -1.5,
    0,
    180,
    0.8,
    '#F06292'
  );

  return {
    galaxies: [galaxyA, galaxyB],
    supernovas: [],
    collisionEvents: [],
    isColliding: false,
    totalStarCount: galaxyA.stars.length + galaxyB.stars.length,
    frameCount: 0,
    history: []
  };
}
