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
  BattleStats
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
      critRate: config.baseStats.critRate
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

export function calculateDamage(
  attacker: Ship,
  target: Ship
): { damage: number; isCrit: boolean; isHit: boolean } {
  const isHit = Math.random() < attacker.stats.accuracy;
  if (!isHit) {
    return { damage: 0, isCrit: false, isHit: false };
  }
  const isCrit = Math.random() < attacker.stats.critRate;
  const baseDamage = Math.max(1, attacker.stats.attack - target.stats.defense * 0.5);
  const critMultiplier = isCrit ? 1.8 : 1;
  const damage = Math.floor(baseDamage * critMultiplier * (0.9 + Math.random() * 0.2));
  return { damage, isCrit, isHit: true };
}

export function performAttack(
  attacker: Ship,
  target: Ship,
  currentTurn: number
): { log: BattleLogEntry; targetKilled: boolean } {
  const { damage, isCrit, isHit } = calculateDamage(attacker, target);
  target.stats.hp = Math.max(0, target.stats.hp - damage);
  const targetKilled = target.stats.hp <= 0;

  let message: string;
  if (!isHit) {
    message = `${attacker.name} 攻击 ${target.name} 未命中！`;
  } else if (isCrit) {
    message = `${attacker.name} 暴击！对 ${target.name} 造成 ${damage} 点伤害${targetKilled ? '，目标已被摧毁！' : ''}`;
  } else {
    message = `${attacker.name} 攻击 ${target.name}，造成 ${damage} 点伤害${targetKilled ? '，目标已被摧毁！' : ''}`;
  }

  return {
    log: {
      id: uuidv4(),
      timestamp: Date.now(),
      turn: currentTurn,
      attacker: attacker.name,
      target: target.name,
      damage,
      isCrit,
      isHit,
      message
    },
    targetKilled
  };
}

export function generateEnemyWave(waveNumber: number): Ship[] {
  const count = Math.floor(Math.random() * 3) + 2;
  const ships: Ship[] = [];
  const types: ShipType[] = ['fighter', 'corvette', 'destroyer'];
  if (waveNumber >= 3) types.push('cruiser');

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
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
  playerShips.forEach((ship, index) => {
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
  enemyShips.forEach((ship, index) => {
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
    isResting: false
  };
}

export function selectAITarget(
  aiShip: Ship,
  playerShips: Ship[]
): Ship | null {
  const alivePlayers = playerShips.filter(s => s.stats.hp > 0);
  if (alivePlayers.length === 0) return null;

  const byDistance = alivePlayers
    .map(s => ({ ship: s, dist: getDistance(aiShip.position, s.position) }))
    .sort((a, b) => a.dist - b.dist);

  const minDist = byDistance[0].dist;
  const sameDistance = byDistance.filter(p => p.dist === minDist);

  sameDistance.sort((a, b) => a.ship.stats.hp - b.ship.stats.hp);
  return sameDistance[0].ship;
}

export function executeAITurn(
  state: BattleState
): { newState: BattleState; logs: BattleLogEntry[]; playerKilledIds: string[] } {
  const logs: BattleLogEntry[] = [];
  const playerKilledIds: string[] = [];
  const newState = JSON.parse(JSON.stringify(state)) as BattleState;

  const aliveEnemies = newState.enemyShips.filter(s => s.stats.hp > 0);
  aliveEnemies.forEach(enemy => {
    const target = selectAITarget(enemy, newState.playerShips);
    if (!target) return;

    const { log, targetKilled } = performAttack(enemy, target, newState.currentTurn);
    logs.push(log);

    if (targetKilled) {
      playerKilledIds.push(target.id);
      const { x, y } = target.position;
      newState.grid[y][x] = null;
    }
  });

  return { newState, logs, playerKilledIds };
}

export function isBattleEnded(state: BattleState): 'player' | 'enemy' | null {
  const playerAlive = state.playerShips.some(s => s.stats.hp > 0);
  const enemyAlive = state.enemyShips.some(s => s.stats.hp > 0);
  if (!playerAlive) return 'enemy';
  if (!enemyAlive) return 'player';
  return null;
}

export function calculateBattleStats(
  startState: BattleState,
  endState: BattleState
): BattleStats {
  const enemiesDestroyed = startState.enemyShips.filter(
    s1 => !endState.enemyShips.find(s2 => s2.id === s1.id && s2.stats.hp > 0)
  ).length;
  const shipsLost = startState.playerShips.filter(
    s1 => !endState.playerShips.find(s2 => s2.id === s1.id && s2.stats.hp > 0)
  ).length;
  return {
    enemiesDestroyed,
    shipsLost,
    duration: Math.floor((Date.now() - (startState.log[0]?.timestamp || Date.now())) / 1000),
    startTimestamp: Date.now()
  };
}
