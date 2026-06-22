import type { BattleshipState, Bullet, Explosion, BattleState } from './types';

let bulletIdCounter = 0;
let explosionIdCounter = 0;

export function createBullet(
  ownerId: string,
  startX: number,
  startY: number,
  startZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  damage: number
): Bullet {
  const speed = 0.3;
  return {
    id: `bullet-${++bulletIdCounter}`,
    x: startX,
    y: startY,
    z: startZ,
    vx: dirX * speed,
    vy: dirY * speed,
    vz: dirZ * speed,
    damage,
    ownerId,
  };
}

export function fireBulletFromShip(shooter: BattleshipState, target: BattleshipState): Bullet {
  const dx = target.posX - shooter.posX;
  const dy = 0;
  const dz = target.posY - shooter.posY;
  const dist = Math.sqrt(dx * dx + dz * dz) || 1;
  const ndx = dx / dist;
  const ndz = dz / dist;

  return createBullet(
    shooter.ownerId,
    shooter.posX + ndx * 1.5,
    0,
    shooter.posY + ndz * 1.5,
    ndx,
    dy,
    ndz,
    shooter.totalAttack
  );
}

export function updateBullets(bullets: Bullet[], bounds: number = 30): Bullet[] {
  return bullets
    .map((b) => ({
      ...b,
      x: b.x + b.vx,
      y: b.y + b.vy,
      z: b.z + b.vz,
    }))
    .filter((b) => Math.abs(b.x) < bounds && Math.abs(b.z) < bounds);
}

function pointInShipBox(
  px: number,
  pz: number,
  ship: BattleshipState
): boolean {
  const halfSize = ship.modules.length * 0.3 + 0.5;
  return (
    Math.abs(px - ship.posX) < halfSize && Math.abs(pz - ship.posY) < halfSize
  );
}

export function checkBulletHits(
  bullets: Bullet[],
  player: BattleshipState,
  opponent: BattleshipState
): {
  remainingBullets: Bullet[];
  playerDamage: number;
  opponentDamage: number;
  hitPositions: Array<{ x: number; y: number; z: number; ownerId: string }>;
} {
  const hitPositions: Array<{ x: number; y: number; z: number; ownerId: string }> = [];
  let playerDamage = 0;
  let opponentDamage = 0;
  const remaining: Bullet[] = [];

  for (const b of bullets) {
    let hit = false;

    if (b.ownerId !== player.ownerId && player.alive && pointInShipBox(b.x, b.z, player)) {
      playerDamage += b.damage;
      hitPositions.push({ x: b.x, y: b.y, z: b.z, ownerId: b.ownerId });
      hit = true;
    }

    if (b.ownerId !== opponent.ownerId && opponent.alive && pointInShipBox(b.x, b.z, opponent)) {
      opponentDamage += b.damage;
      hitPositions.push({ x: b.x, y: b.y, z: b.z, ownerId: b.ownerId });
      hit = true;
    }

    if (!hit) {
      remaining.push(b);
    }
  }

  return {
    remainingBullets: remaining,
    playerDamage,
    opponentDamage,
    hitPositions,
  };
}

export function createHitExplosion(
  x: number,
  y: number,
  z: number
): Explosion {
  return {
    id: `exp-${++explosionIdCounter}`,
    x,
    y,
    z,
    particleCount: 50,
    radius: 1,
    duration: 0.5,
    elapsed: 0,
    colors: ['#ff4444', '#ff8800', '#ffcc00', '#ffffff'],
  };
}

export function createDeathExplosion(
  x: number,
  y: number,
  z: number,
  moduleColors: string[]
): Explosion {
  return {
    id: `exp-${++explosionIdCounter}`,
    x,
    y,
    z,
    particleCount: 100,
    radius: 3,
    duration: 2,
    elapsed: 0,
    colors: moduleColors.length > 0 ? moduleColors : ['#ff4444', '#ff8800', '#ffcc00'],
  };
}

export function updateExplosions(
  explosions: Explosion[],
  dt: number
): Explosion[] {
  return explosions
    .map((e) => ({ ...e, elapsed: e.elapsed + dt }))
    .filter((e) => e.elapsed < e.duration);
}

export function applyDamageToShip(
  ship: BattleshipState,
  damage: number
): BattleshipState {
  const actualDamage = Math.max(0, damage - ship.totalArmor * 0.3);
  const newHP = Math.max(0, ship.totalHP - actualDamage);
  return {
    ...ship,
    totalHP: newHP,
    alive: newHP > 0,
  };
}

export function moveShip(
  ship: BattleshipState,
  dx: number,
  dz: number,
  bounds: number = 12
): BattleshipState {
  const speed = 0.05;
  const newX = Math.max(-bounds, Math.min(bounds, ship.posX + dx * speed));
  const newY = Math.max(-bounds, Math.min(bounds, ship.posY + dz * speed));
  return { ...ship, posX: newX, posY: newY };
}

export function updateBattleState(
  state: BattleState,
  dt: number,
  keys: Set<string>
): BattleState {
  if (state.phase !== 'fighting') return state;

  let player = { ...state.player };
  let opponent = { ...state.opponent };

  if (keys.has('w') || keys.has('W')) player = moveShip(player, 0, -1);
  if (keys.has('s') || keys.has('S')) player = moveShip(player, 0, 1);
  if (keys.has('a') || keys.has('A')) player = moveShip(player, -1, 0);
  if (keys.has('d') || keys.has('D')) player = moveShip(player, 1, 0);

  const opponentDx = Math.sin(Date.now() * 0.001) * 0.5;
  const opponentDz = Math.cos(Date.now() * 0.0007) * 0.3;
  opponent = moveShip(opponent, opponentDx, opponentDz);

  let bullets = updateBullets(state.bullets);
  let explosions = updateExplosions(state.explosions, dt);

  const hitResult = checkBulletHits(bullets, player, opponent);
  bullets = hitResult.remainingBullets;

  for (const hp of hitResult.hitPositions) {
    explosions.push(createHitExplosion(hp.x, hp.y, hp.z));
  }

  if (hitResult.playerDamage > 0) {
    player = applyDamageToShip(player, hitResult.playerDamage);
  }
  if (hitResult.opponentDamage > 0) {
    opponent = applyDamageToShip(opponent, hitResult.opponentDamage);
  }

  if (!player.alive) {
    explosions.push(
      createDeathExplosion(
        player.posX,
        0,
        player.posY,
        player.modules.map((m) => m.type.color)
      )
    );
    return {
      ...state,
      player,
      opponent,
      bullets,
      explosions,
      phase: 'ended',
      winner: opponent.ownerId,
    };
  }

  if (!opponent.alive) {
    explosions.push(
      createDeathExplosion(
        opponent.posX,
        0,
        opponent.posY,
        opponent.modules.map((m) => m.type.color)
      )
    );
    return {
      ...state,
      player,
      opponent,
      bullets,
      explosions,
      phase: 'ended',
      winner: player.ownerId,
    };
  }

  return {
    ...state,
    player,
    opponent,
    bullets,
    explosions,
  };
}

export function initializeBattle(
  playerShip: BattleshipState,
  opponentShip: BattleshipState
): BattleState {
  const player = { ...playerShip, posX: -10, posY: 0, alive: true };
  const opponent = { ...opponentShip, posX: 10, posY: 0, alive: true };
  return {
    player,
    opponent,
    bullets: [],
    explosions: [],
    phase: 'fighting',
    winner: null,
  };
}
