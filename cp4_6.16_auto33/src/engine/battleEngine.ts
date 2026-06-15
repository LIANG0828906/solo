import { v4 as uuidv4 } from 'uuid';
import {
  Ship,
  ShipType,
  SpaceCoord,
  BattleState,
  BattleLogEntry,
  SHIP_CONFIGS,
  GRID_WIDTH,
  GRID_HEIGHT,
  BattleStats,
  WaveState,
  AttackAnimation,
  MAX_WEAPON_RANGE
} from './types';

export function createShip(
  type: ShipType,
  isEnemy: boolean,
  waveNumber: number = 1,
  position?: SpaceCoord
): Ship {
  const config = SHIP_CONFIGS[type];
  const waveMultiplier = 1 + (waveNumber - 1) * 0.1;
  return {
    id: uuidv4(),
    type,
    name: config.name,
    stats: {
      hp: Math.floor(config.baseStats.hp * (isEnemy ? waveMultiplier : 1)),
      maxHp: Math.floor(config.baseStats.maxHp * (isEnemy ? waveMultiplier : 1)),
      attack: Math.floor(config.baseStats.attack * (isEnemy ? waveMultiplier : 1)),
      defense: config.baseStats.defense,
      speed: config.baseStats.speed,
      accuracy: config.baseStats.accuracy,
      critRate: config.baseStats.critRate,
      weaponPrecision: config.baseStats.weaponPrecision,
      shield: {
        value: Math.floor(config.baseStats.shield.maxValue * (isEnemy ? waveMultiplier : 1)),
        maxValue: Math.floor(config.baseStats.shield.maxValue * (isEnemy ? waveMultiplier : 1)),
        regenRate: config.baseStats.shield.regenRate
      }
    },
    bridgeSlots: config.bridgeSlots,
    position: position || { x: 0, y: 0 },
    isEnemy,
    hasActed: false
  };
}

export function getDistance(a: SpaceCoord, b: SpaceCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function calculateHitChance(
  attacker: Ship,
  target: Ship,
  distance: number
): number {
  const baseAccuracy = attacker.stats.accuracy;
  const precision = attacker.stats.weaponPrecision;
  const targetSpeed = target.stats.speed;

  const distanceFactor = Math.max(0.3, 1 - (distance / MAX_WEAPON_RANGE) * 0.5);
  const evasionFactor = Math.max(0.6, 1 - targetSpeed * 0.03);
  const typeBonus = attacker.type === 'fighter' ? 1.1 : attacker.type === 'cruiser' ? 0.95 : 1;

  return Math.min(0.98, baseAccuracy * precision * distanceFactor * evasionFactor * typeBonus);
}

export function calculateCritChance(
  attacker: Ship,
  target: Ship,
  distance: number
): number {
  const baseCrit = attacker.stats.critRate;
  const typeBonus: Record<ShipType, number> = {
    fighter: 1.3,
    corvette: 1.0,
    destroyer: 1.1,
    cruiser: 1.5
  };
  const distanceBonus = distance <= 3 ? 1.2 : distance <= 6 ? 1.0 : 0.8;
  const targetShieldLow = target.stats.shield.value / target.stats.shield.maxValue < 0.3 ? 1.2 : 1;

  return baseCrit * typeBonus[attacker.type] * distanceBonus * targetShieldLow;
}

export function calculateDamageWithShield(
  attacker: Ship,
  target: Ship,
  distance: number
): {
  damage: number;
  shieldAbsorbed: number;
  remainingHp: number;
  remainingShield: number;
  isCrit: boolean;
  isHit: boolean;
} {
  const hitChance = calculateHitChance(attacker, target, distance);
  const isHit = Math.random() < hitChance;
  if (!isHit) {
    return {
      damage: 0,
      shieldAbsorbed: 0,
      remainingHp: target.stats.hp,
      remainingShield: target.stats.shield.value,
      isCrit: false,
      isHit: false
    };
  }

  const critChance = calculateCritChance(attacker, target, distance);
  const isCrit = Math.random() < critChance;
  const critMultiplier = isCrit ? 1.8 : 1;

  const baseDamage = Math.max(1, attacker.stats.attack - target.stats.defense * 0.5);
  const randomFactor = 0.9 + Math.random() * 0.2;
  const distancePenalty = Math.max(0.7, 1 - distance * 0.02);
  const totalDamage = Math.floor(baseDamage * critMultiplier * randomFactor * distancePenalty);

  let shieldAbsorbed = 0;
  let remainingShield = target.stats.shield.value;
  let hpDamage = totalDamage;

  if (target.stats.shield.value > 0) {
    shieldAbsorbed = Math.min(target.stats.shield.value, totalDamage);
    remainingShield = target.stats.shield.value - shieldAbsorbed;
    hpDamage = totalDamage - shieldAbsorbed;
  }

  const remainingHp = Math.max(0, target.stats.hp - hpDamage);

  return {
    damage: totalDamage,
    shieldAbsorbed,
    remainingHp,
    remainingShield,
    isCrit,
    isHit: true
  };
}

export function performAttack(
  attacker: Ship,
  target: Ship,
  currentTurn: number
): {
  log: BattleLogEntry;
  targetKilled: boolean;
  animation: AttackAnimation;
} {
  const distance = getDistance(attacker.position, target.position);
  const result = calculateDamageWithShield(attacker, target, distance);

  target.stats.hp = result.remainingHp;
  target.stats.shield.value = result.remainingShield;
  const targetKilled = result.remainingHp <= 0;

  let message: string;
  if (!result.isHit) {
    message = `[回合${currentTurn}] ${attacker.name} 攻击 ${target.name} —— 未命中！(距离:${distance})`;
  } else if (result.isCrit) {
    message = `[回合${currentTurn}] ${attacker.name} 暴击！对 ${target.name} 造成 ${result.damage} 伤害${result.shieldAbsorbed > 0 ? `(护盾吸收${result.shieldAbsorbed})` : ''}${targetKilled ? '，目标被摧毁！' : `，剩余HP:${result.remainingHp}`}`;
  } else {
    message = `[回合${currentTurn}] ${attacker.name} 攻击 ${target.name}，造成 ${result.damage} 伤害${result.shieldAbsorbed > 0 ? `(护盾吸收${result.shieldAbsorbed})` : ''}${targetKilled ? '，目标被摧毁！' : `，剩余HP:${result.remainingHp} 护盾:${result.remainingShield}`}`;
  }

  return {
    log: {
      id: uuidv4(),
      timestamp: Date.now(),
      turn: currentTurn,
      attacker: attacker.name,
      attackerId: attacker.id,
      target: target.name,
      targetId: target.id,
      damage: result.damage,
      shieldAbsorbed: result.shieldAbsorbed,
      remainingHp: result.remainingHp,
      remainingShield: result.remainingShield,
      isCrit: result.isCrit,
      isHit: result.isHit,
      message
    },
    targetKilled,
    animation: {
      id: uuidv4(),
      from: { ...attacker.position },
      to: { ...target.position },
      progress: 0,
      damage: result.damage,
      isCrit: result.isCrit
    }
  };
}

export function generateWaveState(waveNumber: number): WaveState {
  const enemyCount = Math.floor(Math.random() * 3) + 2;
  return {
    currentWave: waveNumber,
    enemyCount,
    hasCruiser: waveNumber >= 3,
    waveMultiplier: 1 + (waveNumber - 1) * 0.1
  };
}

export function generateEnemyWave(waveNumber: number): Ship[] {
  const waveState = generateWaveState(waveNumber);
  const ships: Ship[] = [];
  const types: ShipType[] = ['fighter', 'corvette', 'destroyer'];
  if (waveState.hasCruiser) types.push('cruiser');

  for (let i = 0; i < waveState.enemyCount; i++) {
    let type: ShipType;
    if (i === 0 && waveState.hasCruiser && Math.random() < 0.4) {
      type = 'cruiser';
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }
    ships.push(createShip(type, true, waveNumber));
  }
  return ships;
}

export function setupBattleGrid(
  playerShips: Ship[],
  enemyShips: Ship[],
  waveNumber: number
): BattleState {
  const grid: (Ship | null)[][] = Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(null));

  const usedPositions = new Set<string>();

  const playerPositions: SpaceCoord[] = [];
  playerShips.forEach((ship) => {
    let pos: SpaceCoord;
    let attempts = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * 2),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };
      attempts++;
    } while (
      (usedPositions.has(`${pos.x},${pos.y}`) ||
        playerPositions.some(p => getDistance(p, pos) < 1)) &&
      attempts < 50
    );
    usedPositions.add(`${pos.x},${pos.y}`);
    playerPositions.push(pos);
    ship.position = pos;
    ship.hasActed = false;
    grid[pos.y][pos.x] = ship;
  });

  const enemyPositions: SpaceCoord[] = [];
  enemyShips.forEach((ship) => {
    let pos: SpaceCoord;
    let attempts = 0;
    do {
      pos = {
        x: GRID_WIDTH - 1 - Math.floor(Math.random() * 2),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };
      attempts++;
    } while (
      (usedPositions.has(`${pos.x},${pos.y}`) ||
        enemyPositions.some(p => getDistance(p, pos) < 1)) &&
      attempts < 50
    );
    usedPositions.add(`${pos.x},${pos.y}`);
    enemyPositions.push(pos);
    ship.position = pos;
    ship.hasActed = false;
    grid[pos.y][pos.x] = ship;
  });

  return {
    grid,
    playerShips: [...playerShips],
    enemyShips: [...enemyShips],
    currentTurn: 1,
    phase: 'player',
    turnPhase: 'select',
    selectedShipId: null,
    log: [],
    waveNumber,
    isResting: false,
    attackAnimations: []
  };
}

export function selectAITarget(
  aiShip: Ship,
  playerShips: Ship[]
): Ship | null {
  const alivePlayers = playerShips.filter(s => s.stats.hp > 0);
  if (alivePlayers.length === 0) return null;

  const scored = alivePlayers.map(s => {
    const dist = getDistance(aiShip.position, s.position);
    const hpFactor = s.stats.hp / s.stats.maxHp;
    const shieldFactor = s.stats.shield.value / s.stats.shield.maxValue;
    const score = dist * 10 + hpFactor * 50 + shieldFactor * 30;
    return { ship: s, score, dist };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0].ship;
}

export function executeAITurn(
  state: BattleState
): {
  newState: BattleState;
  logs: BattleLogEntry[];
  animations: AttackAnimation[];
  playerKilledIds: string[];
  totalDamage: number;
} {
  const logs: BattleLogEntry[] = [];
  const animations: AttackAnimation[] = [];
  const playerKilledIds: string[] = [];
  let totalDamage = 0;
  const newState = JSON.parse(JSON.stringify(state)) as BattleState;

  const aliveEnemies = newState.enemyShips.filter(s => s.stats.hp > 0);
  aliveEnemies.forEach(enemy => {
    const target = selectAITarget(enemy, newState.playerShips);
    if (!target) return;

    const targetInState = newState.playerShips.find(p => p.id === target.id);
    if (!targetInState) return;

    const { log, targetKilled, animation } = performAttack(
      enemy,
      targetInState,
      newState.currentTurn
    );
    logs.push(log);
    animations.push(animation);
    totalDamage += log.damage;

    if (targetKilled) {
      playerKilledIds.push(targetInState.id);
      const { x, y } = targetInState.position;
      newState.grid[y][x] = null;
    }
  });

  newState.playerShips.forEach(s => {
    if (s.stats.hp > 0 && s.stats.shield.value < s.stats.shield.maxValue) {
      s.stats.shield.value = Math.min(
        s.stats.shield.maxValue,
        s.stats.shield.value + s.stats.shield.regenRate
      );
    }
  });

  return { newState, logs, animations, playerKilledIds, totalDamage };
}

export function isBattleEnded(state: BattleState): 'player' | 'enemy' | null {
  const playerAlive = state.playerShips.some(s => s.stats.hp > 0);
  const enemyAlive = state.enemyShips.some(s => s.stats.hp > 0);
  if (!playerAlive) return 'enemy';
  if (!enemyAlive) return 'player';
  return null;
}

export function calculateBattleStats(
  _startState: BattleState,
  endState: BattleState,
  totalDamageDealt: number,
  totalDamageTaken: number
): BattleStats {
  const enemiesDestroyed = endState.log.filter(
    l => !endState.enemyShips.find(e => e.id === l.targetId && e.stats.hp > 0)
  ).length;
  const shipsLost = endState.log.filter(
    l => !endState.playerShips.find(p => p.id === l.targetId && p.stats.hp > 0)
  ).length;
  return {
    enemiesDestroyed,
    shipsLost,
    totalDamageDealt,
    totalDamageTaken,
    duration: Math.floor((Date.now() - (endState.log[0]?.timestamp || Date.now())) / 1000),
    startTimestamp: Date.now()
  };
}
