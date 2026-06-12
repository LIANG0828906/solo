import type { Ship, Projectile, Vector2, Asteroid, OreGrade, Particle } from './types';
import { ORE_CONFIGS, createEngineParticles, createMissileTrail } from './asteroid';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SHIP_SPEED = 200;
const LASER_LENGTH = 100;
const LASER_COOLDOWN = 0.5;
const MISSILE_COOLDOWN = 1;
const MISSILE_SPEED = 300;
const PIRATE_SPEED = 150;
const PIRATE_BULLET_SPEED = 250;
const PIRATE_FIRE_COOLDOWN = 2;
const AI_MINER_SPEED = 180;
const AI_ATTACK_DISTANCE = 150;
const PIRATE_HEALTH = 5;

const AI_NICKNAMES = ['星际猎手', '银河矿工', '太空掠夺者', '彗星追击者', '陨石猎人', '星云探索者'];

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function emptyInventory(): { [grade in OreGrade]: number } {
  return { common: 0, rare: 0, legendary: 0 };
}

export function createPlayerShip(): Ship {
  return {
    id: 'player',
    type: 'player',
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    health: 5,
    inventory: emptyInventory(),
    totalValue: 0,
    lastAttackTime: 0,
    lastMissileTime: 0,
    nickname: '玩家',
    targetAsteroidId: null,
    formationOffset: null
  };
}

export function createAIMiner(id?: string): Ship {
  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;
  switch (edge) {
    case 0: x = randomRange(0, CANVAS_WIDTH); y = -30; break;
    case 1: x = CANVAS_WIDTH + 30; y = randomRange(0, CANVAS_HEIGHT); break;
    case 2: x = randomRange(0, CANVAS_WIDTH); y = CANVAS_HEIGHT + 30; break;
    default: x = -30; y = randomRange(0, CANVAS_HEIGHT); break;
  }
  return {
    id: id || generateId(),
    type: 'ai_miner',
    position: { x, y },
    velocity: { x: 0, y: 0 },
    angle: 0,
    health: 3,
    inventory: emptyInventory(),
    totalValue: 0,
    lastAttackTime: 0,
    lastMissileTime: 0,
    nickname: AI_NICKNAMES[Math.floor(Math.random() * AI_NICKNAMES.length)],
    targetAsteroidId: null,
    formationOffset: null
  };
}

export function createPirateWave(count: number): Ship[] {
  const pirates: Ship[] = [];
  const formationPositions: Vector2[] = [
    { x: 0, y: 0 },
    { x: -40, y: 35 },
    { x: 40, y: 35 },
    { x: -80, y: 70 },
    { x: 80, y: 70 }
  ];
  const startY = randomRange(100, CANVAS_HEIGHT - 100);
  for (let i = 0; i < count; i++) {
    const offset = formationPositions[i] || { x: randomRange(-60, 60), y: randomRange(0, 80) };
    pirates.push({
      id: generateId(),
      type: 'pirate',
      position: { x: CANVAS_WIDTH + 50 + offset.x, y: startY + offset.y },
      velocity: { x: -PIRATE_SPEED, y: 0 },
      angle: Math.PI,
      health: PIRATE_HEALTH,
      inventory: emptyInventory(),
      totalValue: 0,
      lastAttackTime: randomRange(0, PIRATE_FIRE_COOLDOWN),
      lastMissileTime: 0,
      nickname: `海盗-${i + 1}`,
      targetAsteroidId: null,
      formationOffset: offset
    });
  }
  return pirates;
}

export function updatePlayerShip(
  ship: Ship,
  keys: { [key: string]: boolean },
  dt: number,
  currentTime: number,
  particles: Particle[]
): void {
  let moveX = 0;
  let moveY = 0;
  if (keys['w'] || keys['W'] || keys['ArrowUp']) moveY -= 1;
  if (keys['s'] || keys['S'] || keys['ArrowDown']) moveY += 1;
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) moveX += 1;

  const moveMag = Math.sqrt(moveX * moveX + moveY * moveY);
  if (moveMag > 0) {
    moveX /= moveMag;
    moveY /= moveMag;
    ship.angle = Math.atan2(moveY, moveX);
  }

  ship.velocity.x = moveX * SHIP_SPEED;
  ship.velocity.y = moveY * SHIP_SPEED;

  ship.position.x += ship.velocity.x * dt;
  ship.position.y += ship.velocity.y * dt;

  ship.position.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, ship.position.x));
  ship.position.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, ship.position.y));

  if (moveMag > 0 && Math.random() < 0.8) {
    const enginePos = {
      x: ship.position.x - Math.cos(ship.angle) * 15,
      y: ship.position.y - Math.sin(ship.angle) * 15
    };
    particles.push(createEngineParticles(enginePos, ship.angle, '#44aaff'));
  }
}

export function fireLaser(ship: Ship, currentTime: number): Projectile | null {
  if (currentTime - ship.lastAttackTime < LASER_COOLDOWN) return null;
  ship.lastAttackTime = currentTime;

  return {
    id: generateId(),
    position: { ...ship.position },
    velocity: {
      x: Math.cos(ship.angle) * 1000,
      y: Math.sin(ship.angle) * 1000
    },
    type: 'laser',
    damage: 1,
    life: LASER_LENGTH / 1000,
    maxLife: LASER_LENGTH / 1000,
    ownerId: ship.id
  };
}

export function fireMissile(ship: Ship, currentTime: number): Projectile | null {
  if (currentTime - ship.lastMissileTime < MISSILE_COOLDOWN) return null;
  ship.lastMissileTime = currentTime;

  return {
    id: generateId(),
    position: { ...ship.position },
    velocity: {
      x: Math.cos(ship.angle) * MISSILE_SPEED,
      y: Math.sin(ship.angle) * MISSILE_SPEED
    },
    type: 'missile',
    damage: 3,
    life: 3,
    maxLife: 3,
    ownerId: ship.id
  };
}

export function updateAIMiner(
  miner: Ship,
  asteroids: Asteroid[],
  player: Ship,
  dt: number,
  currentTime: number,
  particles: Particle[]
): Projectile | null {
  const distToPlayer = distance(miner.position, player.position);
  let targetPos: Vector2;

  if (distToPlayer < AI_ATTACK_DISTANCE) {
    targetPos = player.position;
    const dx = player.position.x - miner.position.x;
    const dy = player.position.y - miner.position.y;
    miner.angle = Math.atan2(dy, dx);
  } else {
    if (!miner.targetAsteroidId || !asteroids.find(a => a.id === miner.targetAsteroidId)) {
      let nearest: Asteroid | null = null;
      let nearestDist = Infinity;
      for (const asteroid of asteroids) {
        const d = distance(miner.position, asteroid.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = asteroid;
        }
      }
      miner.targetAsteroidId = nearest ? nearest.id : null;
    }

    const target = asteroids.find(a => a.id === miner.targetAsteroidId);
    if (target) {
      targetPos = target.position;
      const dx = target.position.x - miner.position.x;
      const dy = target.position.y - miner.position.y;
      miner.angle = Math.atan2(dy, dx);
    } else {
      targetPos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    }
  }

  const dx = targetPos.x - miner.position.x;
  const dy = targetPos.y - miner.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 5) {
    miner.velocity.x = (dx / dist) * AI_MINER_SPEED;
    miner.velocity.y = (dy / dist) * AI_MINER_SPEED;
    miner.position.x += miner.velocity.x * dt;
    miner.position.y += miner.velocity.y * dt;

    if (Math.random() < 0.6) {
      const enginePos = {
        x: miner.position.x - Math.cos(miner.angle) * 15,
        y: miner.position.y - Math.sin(miner.angle) * 15
      };
      particles.push(createEngineParticles(enginePos, miner.angle, '#ff6666'));
    }
  }

  miner.position.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, miner.position.x));
  miner.position.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, miner.position.y));

  if (distToPlayer < AI_ATTACK_DISTANCE && currentTime - miner.lastMissileTime > 2) {
    return fireMissile(miner, currentTime);
  }

  return null;
}

export function updatePirate(
  pirate: Ship,
  allShips: Ship[],
  dt: number,
  currentTime: number,
  particles: Particle[]
): Projectile | null {
  pirate.position.x += pirate.velocity.x * dt;
  pirate.position.y += pirate.velocity.y * dt;

  if (pirate.formationOffset) {
    const targetY = pirate.position.y;
    pirate.position.y = targetY;
  }

  if (Math.random() < 0.5) {
    const enginePos = {
      x: pirate.position.x - Math.cos(pirate.angle) * 18,
      y: pirate.position.y - Math.sin(pirate.angle) * 18
    };
    particles.push(createEngineParticles(enginePos, pirate.angle, '#ff2222'));
  }

  let nearestShip: Ship | null = null;
  let nearestDist = Infinity;
  for (const ship of allShips) {
    if (ship.id === pirate.id || ship.type === 'pirate') continue;
    const d = distance(pirate.position, ship.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestShip = ship;
    }
  }

  if (nearestShip && currentTime - pirate.lastAttackTime > PIRATE_FIRE_COOLDOWN) {
    pirate.lastAttackTime = currentTime;
    const dx = nearestShip.position.x - pirate.position.x;
    const dy = nearestShip.position.y - pirate.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return {
      id: generateId(),
      position: { ...pirate.position },
      velocity: {
        x: (dx / dist) * PIRATE_BULLET_SPEED,
        y: (dy / dist) * PIRATE_BULLET_SPEED
      },
      type: 'pirate_bullet',
      damage: 1,
      life: 3,
      maxLife: 3,
      ownerId: pirate.id
    };
  }

  return null;
}

export function updateProjectiles(
  projectiles: Projectile[],
  dt: number,
  particles: Particle[]
): void {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    p.life -= dt;

    if (p.type === 'missile' && Math.random() < 0.9) {
      particles.push(createMissileTrail({ ...p.position }));
    }

    if (p.life <= 0 ||
        p.position.x < -50 || p.position.x > CANVAS_WIDTH + 50 ||
        p.position.y < -50 || p.position.y > CANVAS_HEIGHT + 50) {
      projectiles.splice(i, 1);
    }
  }
}

export function checkProjectileAsteroidCollision(
  projectiles: Projectile[],
  asteroids: Asteroid[],
  ships: Ship[]
): { destroyedAsteroids: string[], hitAsteroids: string[] } {
  const destroyed: string[] = [];
  const hit: string[] = [];

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.type !== 'laser' && p.type !== 'missile') continue;

    for (const asteroid of asteroids) {
      const d = distance(p.position, asteroid.position);
      if (d < asteroid.radius + 5) {
        const shooter = ships.find(s => s.id === p.ownerId);
        if (shooter && (shooter.type === 'player' || shooter.type === 'ai_miner')) {
          shooter.inventory[asteroid.grade]++;
          shooter.totalValue += ORE_CONFIGS[asteroid.grade].value;
        }

        hit.push(asteroid.id);
        projectiles.splice(i, 1);
        break;
      }
    }
  }

  return { destroyedAsteroids: destroyed, hitAsteroids: hit };
}

export function checkProjectileShipCollision(
  projectiles: Projectile[],
  ships: Ship[]
): { hitShips: string[], destroyedShips: string[] } {
  const hit: string[] = [];
  const destroyed: string[] = [];

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    for (const ship of ships) {
      if (ship.id === p.ownerId) continue;
      if (p.type === 'pirate_bullet' && ship.type === 'pirate') continue;
      if (p.type === 'missile' && ship.type === 'ai_miner' && p.ownerId === ship.id) continue;

      const d = distance(p.position, ship.position);
      if (d < 20) {
        ship.health -= p.damage;
        hit.push(ship.id);

        if (ship.health <= 0) {
          destroyed.push(ship.id);
        } else if (p.type === 'pirate_bullet' && ship.inventory) {
          const totalOre = ship.inventory.common + ship.inventory.rare + ship.inventory.legendary;
          const lossCount = Math.ceil(totalOre * 0.1);
          let remaining = lossCount;
          if (ship.inventory.common > 0) {
            const take = Math.min(remaining, ship.inventory.common);
            ship.inventory.common -= take;
            ship.totalValue -= take * ORE_CONFIGS.common.value;
            remaining -= take;
          }
          if (remaining > 0 && ship.inventory.rare > 0) {
            const take = Math.min(remaining, ship.inventory.rare);
            ship.inventory.rare -= take;
            ship.totalValue -= take * ORE_CONFIGS.rare.value;
            remaining -= take;
          }
          if (remaining > 0 && ship.inventory.legendary > 0) {
            const take = Math.min(remaining, ship.inventory.legendary);
            ship.inventory.legendary -= take;
            ship.totalValue -= take * ORE_CONFIGS.legendary.value;
          }
        }

        projectiles.splice(i, 1);
        break;
      }
    }
  }

  return { hitShips: hit, destroyedShips: destroyed };
}

export function drawShip(ctx: CanvasRenderingContext2D, ship: Ship): void {
  ctx.save();
  ctx.translate(ship.position.x, ship.position.y);
  ctx.rotate(ship.angle);

  if (ship.type === 'player') {
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fillStyle = '#4477dd';
    ctx.fill();
    ctx.strokeStyle = '#66aaff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowColor = '#4477dd';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (ship.type === 'ai_miner') {
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fillStyle = '#dd4444';
    ctx.fill();
