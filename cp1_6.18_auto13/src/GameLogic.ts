export interface Vec2 {
  x: number;
  y: number;
}

export interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  trail: Vec2[];
  opacity: number;
  stunTime: number;
  collisionCount: number;
  collisionCooldown: number;
}

export interface EnergyBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDouble: boolean;
  rotation: number;
  pulsePhase: number;
  trail: Vec2[];
  collecting: boolean;
}

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  vertices: number[];
}

export interface GravityTrap {
  id: number;
  x: number;
  y: number;
  flashPhase: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  vx: number;
  vy: number;
}

export interface RepulsionWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  active: boolean;
}

export interface Portal {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  expanding: boolean;
  alpha: number;
  active: boolean;
}

export interface GameState {
  ship: Ship;
  energyBalls: EnergyBall[];
  asteroids: Asteroid[];
  traps: GravityTrap[];
  stars: Star[];
  repulsionWave: RepulsionWave;
  portal: Portal;
  score: number;
  level: number;
  gravityRadius: number;
  isGravityActive: boolean;
  gravityHoldTime: number;
  isPaused: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  shakeTime: number;
  lastTrapSpawn: number;
  targetEnergy: number;
  collectedSinceUpgrade: number;
  isMobile: boolean;
}

export interface GameConfig {
  width: number;
  height: number;
  baseGravityRadius: number;
  maxGravityRadius: number;
  gravityRadiusIncrease: number;
  energyBallCount: number;
  asteroidCount: number;
  trapInterval: number;
  stunDuration: number;
  shakeDuration: number;
  collisionResetCount: number;
  targetEnergyBase: number;
  repulsionWaveDuration: number;
  portalDuration: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  baseGravityRadius: 150,
  maxGravityRadius: 300,
  gravityRadiusIncrease: 20,
  energyBallCount: 15,
  asteroidCount: 25,
  trapInterval: 10000,
  stunDuration: 1500,
  shakeDuration: 300,
  collisionResetCount: 3,
  targetEnergyBase: 10,
  repulsionWaveDuration: 2000,
  portalDuration: 1500,
};

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

let nextId = 0;
function genId(): number {
  return ++nextId;
}

function generateAsteroidVertices(size: number): number[] {
  const vertices: number[] = [];
  const numVertices = Math.floor(rand(6, 10));
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const r = size * rand(0.7, 1.3);
    vertices.push(angle, r);
  }
  return vertices;
}

export function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      size: rand(1, 3),
      brightness: rand(0.2, 0.8),
      vx: rand(2, 8),
      vy: rand(1, 4),
    });
  }
  return stars;
}

export function createEnergyBalls(count: number, width: number, height: number): EnergyBall[] {
  const balls: EnergyBall[] = [];
  for (let i = 0; i < count; i++) {
    balls.push({
      id: genId(),
      x: rand(50, width - 50),
      y: rand(50, height - 50),
      vx: rand(-20, 20),
      vy: rand(-20, 20),
      isDouble: false,
      rotation: rand(0, Math.PI * 2),
      pulsePhase: rand(0, Math.PI * 2),
      trail: [],
      collecting: false,
    });
  }
  return balls;
}

export function createAsteroids(count: number, width: number, height: number): Asteroid[] {
  const asteroids: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    const size = rand(10, 25);
    asteroids.push({
      id: genId(),
      x: rand(50, width - 50),
      y: rand(50, height - 50),
      vx: rand(-30, 30),
      vy: rand(-30, 30),
      size,
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.5, 0.5),
      vertices: generateAsteroidVertices(size),
    });
  }
  return asteroids;
}

export function createShip(width: number, height: number): Ship {
  return {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    rotation: -Math.PI / 2,
    trail: [],
    opacity: 1,
    stunTime: 0,
    collisionCount: 0,
    collisionCooldown: 0,
  };
}

export function createTrap(width: number, height: number): GravityTrap {
  return {
    id: genId(),
    x: rand(50, width - 50),
    y: rand(50, height - 50),
    flashPhase: 0,
  };
}

export function updateStars(stars: Star[], dt: number, width: number, height: number): Star[] {
  return stars.map(star => {
    let x = star.x + star.vx * dt;
    let y = star.y + star.vy * dt;
    if (x > width) x = 0;
    if (y > height) y = 0;
    return { ...star, x, y };
  });
}

export function updateShip(
  ship: Ship,
  targetX: number,
  targetY: number,
  dt: number,
  width: number,
  height: number
): Ship {
  if (ship.stunTime > 0) {
    return {
      ...ship,
      stunTime: Math.max(0, ship.stunTime - dt * 1000),
      collisionCooldown: Math.max(0, ship.collisionCooldown - dt * 1000),
    };
  }

  const dx = targetX - ship.x;
  const dy = targetY - ship.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let vx = ship.vx;
  let vy = ship.vy;

  if (distance > 2) {
    const speed = 300;
    vx = (dx / distance) * speed;
    vy = (dy / distance) * speed;
  } else {
    vx *= 0.9;
    vy *= 0.9;
  }

  let x = ship.x + vx * dt;
  let y = ship.y + vy * dt;

  x = Math.max(15, Math.min(width - 15, x));
  y = Math.max(15, Math.min(height - 15, y));

  const rotation = Math.atan2(vy, vx);

  const newTrail = [...ship.trail, { x: ship.x, y: ship.y }];
  if (newTrail.length > 15) newTrail.shift();

  return {
    ...ship,
    x,
    y,
    vx,
    vy,
    rotation: distance > 2 ? rotation : ship.rotation,
    trail: newTrail,
    opacity: ship.collisionCooldown > 0 ? 0.4 : 1,
    collisionCooldown: Math.max(0, ship.collisionCooldown - dt * 1000),
  };
}

export function applyGravity(
  balls: EnergyBall[],
  ship: Ship,
  gravityRadius: number,
  isActive: boolean,
  dt: number
): EnergyBall[] {
  if (!isActive) return balls;

  return balls.map(ball => {
    if (ball.collecting) return ball;

    const dx = ship.x - ball.x;
    const dy = ship.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < gravityRadius && distance > 5) {
      const force = (1 - distance / gravityRadius) * 500;
      const ax = (dx / distance) * force;
      const ay = (dy / distance) * force;
      return {
        ...ball,
        vx: ball.vx + ax * dt,
        vy: ball.vy + ay * dt,
      };
    }
    return ball;
  });
}

export function updateEnergyBalls(
  balls: EnergyBall[],
  dt: number,
  width: number,
  height: number
): EnergyBall[] {
  return balls.map(ball => {
    let x = ball.x + ball.vx * dt;
    let y = ball.y + ball.vy * dt;
    let vx = ball.vx;
    let vy = ball.vy;

    if (x < 10 || x > width - 10) {
      vx *= -0.8;
      x = Math.max(10, Math.min(width - 10, x));
    }
    if (y < 10 || y > height - 10) {
      vy *= -0.8;
      y = Math.max(10, Math.min(height - 10, y));
    }

    vx *= 0.995;
    vy *= 0.995;

    const newTrail = [...ball.trail, { x: ball.x, y: ball.y }];
    if (newTrail.length > 12) newTrail.shift();

    return {
      ...ball,
      x,
      y,
      vx,
      vy,
      rotation: ball.rotation + dt * 2,
      pulsePhase: ball.pulsePhase + dt * 4,
      trail: ball.collecting ? newTrail : ball.trail,
    };
  });
}

export function updateAsteroids(
  asteroids: Asteroid[],
  dt: number,
  width: number,
  height: number
): Asteroid[] {
  return asteroids.map(ast => {
    let x = ast.x + ast.vx * dt;
    let y = ast.y + ast.vy * dt;
    let vx = ast.vx;
    let vy = ast.vy;

    if (x < ast.size || x > width - ast.size) {
      vx *= -1;
      x = Math.max(ast.size, Math.min(width - ast.size, x));
    }
    if (y < ast.size || y > height - ast.size) {
      vy *= -1;
      y = Math.max(ast.size, Math.min(height - ast.size, y));
    }

    return {
      ...ast,
      x,
      y,
      vx,
      vy,
      rotation: ast.rotation + ast.rotationSpeed * dt,
    };
  });
}

export function applyRepulsionToAsteroids(
  asteroids: Asteroid[],
  wave: RepulsionWave,
  dt: number
): Asteroid[] {
  if (!wave.active) return asteroids;

  return asteroids.map(ast => {
    const dx = ast.x - wave.x;
    const dy = ast.y - wave.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < wave.radius && distance > 1) {
      const force = (1 - distance / wave.radius) * 800;
      return {
        ...ast,
        vx: ast.vx + (dx / distance) * force * dt,
        vy: ast.vy + (dy / distance) * force * dt,
      };
    }
    return ast;
  });
}

export function checkCollisions(
  ship: Ship,
  balls: EnergyBall[],
  asteroids: Asteroid[],
  traps: GravityTrap[],
  config: GameConfig
): {
  ship: Ship;
  collectedBalls: EnergyBall[];
  remainingBalls: EnergyBall[];
  hitAsteroid: boolean;
  hitTrap: boolean;
} {
  const collected: EnergyBall[] = [];
  const remaining: EnergyBall[] = [];
  let hitAsteroid = false;
  let hitTrap = false;

  for (const ball of balls) {
    const d = dist(ship, ball);
    const collectRadius = ball.isDouble ? 18 : 12;
    if (d < 20 + collectRadius / 2) {
      collected.push(ball);
    } else {
      remaining.push(ball);
    }
  }

  if (ship.collisionCooldown <= 0) {
    for (const ast of asteroids) {
      const d = dist(ship, ast);
      if (d < 15 + ast.size * 0.7) {
        hitAsteroid = true;
        break;
      }
    }
  }

  if (ship.stunTime <= 0) {
    for (const trap of traps) {
      const d = dist(ship, trap);
      if (d < 30) {
        hitTrap = true;
        break;
      }
    }
  }

  let newShip = { ...ship };
  if (hitAsteroid) {
    newShip.collisionCount = ship.collisionCount + 1;
    newShip.collisionCooldown = 1000;
    newShip.opacity = 0.4;
  }

  if (hitTrap) {
    newShip.stunTime = config.stunDuration;
  }

  return {
    ship: newShip,
    collectedBalls: collected,
    remainingBalls: remaining,
    hitAsteroid,
    hitTrap,
  };
}

export function updateTraps(traps: GravityTrap[], dt: number): GravityTrap[] {
  return traps.map(trap => ({
    ...trap,
    flashPhase: trap.flashPhase + dt * 3,
  }));
}

export function updateRepulsionWave(wave: RepulsionWave, dt: number): RepulsionWave {
  if (!wave.active) return wave;

  const newRadius = wave.radius + 400 * dt;
  const progress = newRadius / wave.maxRadius;
  const newAlpha = Math.max(0, 1 - progress);

  return {
    ...wave,
    radius: newRadius,
    alpha: newAlpha,
    active: newRadius < wave.maxRadius,
  };
}

export function updatePortal(portal: Portal, dt: number): Portal {
  if (!portal.active) return portal;

  return {
    ...portal,
    rotation: portal.rotation + dt * 3,
    radius: portal.expanding
      ? Math.min(portal.radius + 80 * dt, 80)
      : portal.radius,
    alpha: portal.expanding ? Math.min(1, portal.alpha + dt * 2) : portal.alpha,
  };
}

export function spawnDoubleBall(width: number, height: number): EnergyBall {
  return {
    id: genId(),
    x: rand(50, width - 50),
    y: rand(50, height - 50),
    vx: rand(-10, 10),
    vy: rand(-10, 10),
    isDouble: true,
    rotation: rand(0, Math.PI * 2),
    pulsePhase: 0,
    trail: [],
    collecting: false,
  };
}

export function resetLevel(config: GameConfig): {
  ship: Ship;
  energyBalls: EnergyBall[];
  asteroids: Asteroid[];
  traps: GravityTrap[];
  score: number;
  gravityRadius: number;
  collectedSinceUpgrade: number;
} {
  nextId = 0;
  return {
    ship: createShip(config.width, config.height),
    energyBalls: createEnergyBalls(config.energyBallCount, config.width, config.height),
    asteroids: createAsteroids(config.asteroidCount, config.width, config.height),
    traps: [],
    score: 0,
    gravityRadius: config.baseGravityRadius,
    collectedSinceUpgrade: 0,
  };
}
