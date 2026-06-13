import {
  Player,
  GameMap,
  TileType,
  Item,
  ItemType,
  Effect,
  Particle,
  MAP_SIZE,
  MAX_MOVE_DISTANCE,
  TRAP_REVEAL_DURATION,
  TRAP_EFFECT_DURATION,
  MOVE_ANIMATION_DURATION,
  ATTACK_ANIMATION_DURATION
} from './types';
import {
  isWalkable,
  getTile,
  revealAroundPosition
} from './mapGenerator';
import {
  breakStealth,
  dealDamage,
  addItem,
  createRandomItem,
  getOtherPlayer,
  canMove,
  canAttack,
  useExtraAction
} from './playerManager';

interface Position {
  x: number;
  y: number;
}

interface MoveResult {
  success: boolean;
  trapTriggered?: boolean;
  chestCollected?: Item;
}

interface AttackResult {
  success: boolean;
  damage?: number;
  hit?: boolean;
}

export function calculateMoveRange(
  map: GameMap,
  startX: number,
  startY: number,
  players: [Player, Player]
): Position[] {
  const visited = new Set<string>();
  const result: Position[] = [];
  const queue: { x: number; y: number; dist: number }[] = [];

  const playerPositions = new Set(
    players.map(p => `${p.x},${p.y}`)
  );

  queue.push({ x: startX, y: startY, dist: 0 });
  visited.add(`${startX},${startY}`);

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.dist > 0) {
      result.push({ x: current.x, y: current.y });
    }

    if (current.dist < MAX_MOVE_DISTANCE) {
      for (const dir of directions) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        const key = `${nx},${ny}`;

        if (!visited.has(key) && isWalkable(map, nx, ny) && !playerPositions.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny, dist: current.dist + 1 });
        }
      }
    }
  }

  return result;
}

export function calculateDamage(
  attacker: Player,
  defender: Player,
  map: GameMap
): number {
  let damage = attacker.attack;

  if (attacker.stealth) {
    damage *= 0.5;
  }

  if (defender.stealth) {
    damage *= 0.5;
  }

  const defenderTile = getTile(map, defender.x, defender.y);
  if (defenderTile && defenderTile.type === TileType.COVER && defender.turnsWithoutMoving >= 1) {
    damage *= 0.5;
  }

  return Math.floor(damage);
}

export function movePlayer(
  player: Player,
  targetX: number,
  targetY: number,
  map: GameMap,
  players: [Player, Player],
  hasActed: boolean
): MoveResult {
  if (!canMove(player, hasActed)) {
    return { success: false };
  }

  const moveRange = calculateMoveRange(map, player.x, player.y, players);
  const isInRange = moveRange.some(p => p.x === targetX && p.y === targetY);

  if (!isInRange) {
    return { success: false };
  }

  const otherPlayer = getOtherPlayer(players, player.id);
  if (otherPlayer.x === targetX && otherPlayer.y === targetY) {
    return { success: false };
  }

  player.isMoving = true;
  player.moveProgress = 0;

  breakStealth(player);
  player.stats.totalMoves++;

  const result: MoveResult = { success: true };

  const tile = getTile(map, targetX, targetY);
  if (tile) {
    if (tile.type === TileType.TRAP && !tile.trapTriggered) {
      tile.trapTriggered = true;
      tile.trapEffectTimer = TRAP_EFFECT_DURATION;
      player.revealed = true;
      player.revealTimer = TRAP_REVEAL_DURATION;
      result.trapTriggered = true;

      otherPlayer.alertAction = true;
    }

    if (tile.type === TileType.CHEST && !tile.chestCollected) {
      tile.chestCollected = true;
      const item = createRandomItem();
      addItem(player, item);
      result.chestCollected = item;
    }
  }

  revealAroundPosition(map, targetX, targetY, 3);

  return result;
}

export function attackAdjacent(
  player: Player,
  direction: { x: number; y: number },
  map: GameMap,
  players: [Player, Player],
  hasActed: boolean,
  trapTriggered: boolean = false
): AttackResult {
  if (!canAttack(player, hasActed)) {
    return { success: false };
  }

  const targetX = player.x + direction.x;
  const targetY = player.y + direction.y;

  const otherPlayer = getOtherPlayer(players, player.id);

  if (otherPlayer.x !== targetX || otherPlayer.y !== targetY) {
    player.isAttacking = true;
    player.attackProgress = 0;
    player.attackDirection = direction;
    breakStealth(player);
    player.stats.totalAttacks++;
    return { success: true, hit: false };
  }

  if (trapTriggered) {
    return { success: false };
  }

  const damage = calculateDamage(player, otherPlayer, map);
  dealDamage(otherPlayer, damage);

  player.isAttacking = true;
  player.attackProgress = 0;
  player.attackDirection = direction;

  breakStealth(player);
  player.stats.totalAttacks++;

  otherPlayer.revealed = true;
  otherPlayer.revealTimer = TRAP_REVEAL_DURATION;

  return { success: true, hit: true, damage };
}

export function createTrailEffect(
  player: Player,
  effects: Effect[]
): void {
  effects.push({
    type: 'trail',
    x: player.renderX,
    y: player.renderY,
    duration: 500,
    elapsed: 0,
    playerId: player.id,
    data: { color: player.color }
  });
}

export function createSlashEffect(
  player: Player,
  direction: { x: number; y: number },
  effects: Effect[]
): void {
  effects.push({
    type: 'slash',
    x: player.x + direction.x * 0.5,
    y: player.y + direction.y * 0.5,
    duration: ATTACK_ANIMATION_DURATION,
    elapsed: 0,
    playerId: player.id,
    data: { direction, color: player.color }
  });
}

export function createAlertEffect(
  x: number,
  y: number,
  playerId: 1 | 2,
  effects: Effect[]
): void {
  effects.push({
    type: 'alert',
    x,
    y,
    duration: TRAP_EFFECT_DURATION,
    elapsed: 0,
    playerId
  });
}

export function createPickupEffect(
  player: Player,
  itemType: ItemType,
  effects: Effect[]
): void {
  effects.push({
    type: 'pickup',
    x: player.x,
    y: player.y,
    duration: 2000,
    elapsed: 0,
    playerId: player.id,
    data: { itemType }
  });
}

export function createStealthParticle(
  x: number,
  y: number,
  color: string,
  particles: Particle[],
  particlePool: Particle[]
): void {
  let particle = particlePool.find(p => !p.active);
  
  if (!particle) {
    particle = {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      color: '', size: 0,
      active: false
    };
    particlePool.push(particle);
  }

  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.5;

  particle.x = x + (Math.random() - 0.5) * 0.8;
  particle.y = y + (Math.random() - 0.5) * 0.8;
  particle.vx = Math.cos(angle) * speed;
  particle.vy = Math.sin(angle) * speed - 0.5;
  particle.life = 1000 + Math.random() * 500;
  particle.maxLife = particle.life;
  particle.color = color;
  particle.size = 2 + Math.random() * 3;
  particle.active = true;

  particles.push(particle);
}

export function createTrailParticle(
  x: number,
  y: number,
  color: string,
  particles: Particle[],
  particlePool: Particle[]
): void {
  let particle = particlePool.find(p => !p.active);
  
  if (!particle) {
    particle = {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      color: '', size: 0,
      active: false
    };
    particlePool.push(particle);
  }

  particle.x = x + (Math.random() - 0.5) * 0.5;
  particle.y = y + (Math.random() - 0.5) * 0.5;
  particle.vx = (Math.random() - 0.5) * 0.2;
  particle.vy = (Math.random() - 0.5) * 0.2;
  particle.life = 300 + Math.random() * 200;
  particle.maxLife = particle.life;
  particle.color = color;
  particle.size = 3 + Math.random() * 3;
  particle.active = true;

  particles.push(particle);
}

export function updatePlayerAnimations(
  player: Player,
  deltaTime: number
): void {
  if (player.isMoving) {
    player.moveProgress += deltaTime;
    const progress = Math.min(1, player.moveProgress / MOVE_ANIMATION_DURATION);
    
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    player.renderX = player.x;
    player.renderY = player.y;

    if (progress >= 1) {
      player.isMoving = false;
      player.moveProgress = 0;
    }
  }

  if (player.isAttacking) {
    player.attackProgress += deltaTime;
    if (player.attackProgress >= ATTACK_ANIMATION_DURATION) {
      player.isAttacking = false;
      player.attackProgress = 0;
    }
  }
}

export function updateParticles(
  particles: Particle[],
  deltaTime: number
): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (!p.active) continue;

    p.life -= deltaTime;
    p.x += p.vx * deltaTime / 16;
    p.y += p.vy * deltaTime / 16;
    p.vy += 0.01;

    if (p.life <= 0) {
      p.active = false;
      particles.splice(i, 1);
    }
  }
}

export function updateEffects(
  effects: Effect[],
  deltaTime: number
): void {
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].elapsed += deltaTime;
    if (effects[i].elapsed >= effects[i].duration) {
      effects.splice(i, 1);
    }
  }
}

export function updateTrapEffects(
  map: GameMap,
  deltaTime: number
): void {
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = map[y][x];
      if (tile.trapEffectTimer > 0) {
        tile.trapEffectTimer -= deltaTime;
        if (tile.trapEffectTimer <= 0) {
          tile.trapEffectTimer = 0;
        }
      }
    }
  }
}

export function checkGameOver(players: [Player, Player]): Player | null {
  if (!players[0].isAlive) return players[1];
  if (!players[1].isAlive) return players[0];
  return null;
}

export function endTurn(
  currentPlayer: Player,
  otherPlayer: Player,
  movedOrAttacked: boolean
): void {
  if (!movedOrAttacked) {
    currentPlayer.turnsWithoutMoving++;
  }

  if (currentPlayer.turnsWithoutMoving >= 2) {
    currentPlayer.stealth = true;
  }

  otherPlayer.turnsWithoutMoving++;
  if (otherPlayer.turnsWithoutMoving >= 2) {
    otherPlayer.stealth = true;
  }
}
