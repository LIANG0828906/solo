import { v4 as uuidv4 } from 'uuid';
import { executeBehaviorTree, type BehaviorTree, type ActionType } from './behavior-tree';

export type TerrainType = 'grass' | 'forest' | 'rock' | 'river';
export type UnitClass = 'warrior' | 'archer' | 'mage' | 'assassin';
export type Team = 'red' | 'blue';

export interface TerrainInfo {
  type: TerrainType;
  moveCost: number;
  passable: boolean;
  color: string;
  icon: string;
}

export const TERRAIN_INFO: Record<TerrainType, TerrainInfo> = {
  grass: { type: 'grass', moveCost: 1, passable: true, color: '#8fbc8f', icon: '🌿' },
  forest: { type: 'forest', moveCost: 2, passable: true, color: '#228b22', icon: '🌲' },
  rock: { type: 'rock', moveCost: 3, passable: true, color: '#808080', icon: '🪨' },
  river: { type: 'river', moveCost: Infinity, passable: false, color: '#4169e1', icon: '🌊' },
};

export interface UnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  moveRange: number;
  attackRange: number;
}

export const UNIT_STATS: Record<UnitClass, UnitStats> = {
  warrior: { maxHp: 500, attack: 50, defense: 30, moveRange: 2, attackRange: 1 },
  archer: { maxHp: 250, attack: 40, defense: 10, moveRange: 3, attackRange: 4 },
  mage: { maxHp: 200, attack: 60, defense: 5, moveRange: 2, attackRange: 3 },
  assassin: { maxHp: 300, attack: 55, defense: 15, moveRange: 5, attackRange: 1 },
};

export const UNIT_COLORS: Record<UnitClass, string> = {
  warrior: '#ff4d4f',
  archer: '#52c41a',
  mage: '#1890ff',
  assassin: '#722ed1',
};

export interface Unit {
  id: string;
  name: string;
  unitClass: UnitClass;
  team: Team;
  position: { x: number; y: number };
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveRange: number;
  attackRange: number;
  behaviorTreeId: string;
  isAlive: boolean;
}

export interface GridCell {
  x: number;
  y: number;
  terrain: TerrainType;
}

export interface BattleLog {
  id: string;
  timestamp: number;
  turn: number;
  unitId: string;
  unitName: string;
  action: string;
  details: {
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    damage?: number;
    originalDamage?: number;
    remainingHp?: number;
    targetId?: string;
    targetName?: string;
    terrain?: TerrainType;
  };
}

export const GRID_WIDTH = 6;
export const GRID_HEIGHT = 8;
export const CELL_SIZE = 64;

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

const DEFAULT_TERRAIN: [number, number, TerrainType][] = [
  [1, 3, 'forest'], [2, 3, 'forest'], [3, 4, 'forest'], [4, 4, 'forest'],
  [2, 5, 'rock'], [3, 5, 'rock'],
  [3, 2, 'river'], [3, 3, 'river'],
];

export function createGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[y][x] = {
        x,
        y,
        terrain: 'grass',
      };
    }
  }
  for (const [x, y, terrain] of DEFAULT_TERRAIN) {
    if (y < GRID_HEIGHT && x < GRID_WIDTH) {
      grid[y][x].terrain = terrain;
    }
  }
  return grid;
}

export function createUnit(
  unitClass: UnitClass,
  team: Team,
  position: { x: number; y: number },
  behaviorTreeId: string,
  name?: string
): Unit {
  const stats = UNIT_STATS[unitClass];
  const defaultNames: Record<Team, Record<UnitClass, string>> = {
    red: { warrior: '红方战士', archer: '红方弓箭手', mage: '红方法师', assassin: '红方刺客' },
    blue: { warrior: '蓝方战士', archer: '蓝方弓箭手', mage: '蓝方法师', assassin: '蓝方刺客' },
  };

  return {
    id: uuidv4(),
    name: name || defaultNames[team][unitClass],
    unitClass,
    team,
    position: { ...position },
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
    moveRange: stats.moveRange,
    attackRange: stats.attackRange,
    behaviorTreeId,
    isAlive: true,
  };
}

export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  grid: GridCell[][],
  moveRange: number
): { x: number; y: number }[] | null {
  if (startX === endX && startY === endY) {
    return [{ x: startX, y: startY }];
  }

  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY, endX, endY),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    if (current.x === endX && current.y === endY) {
      return reconstructPath(current);
    }

    closedSet.add(`${current.x},${current.y}`);

    const neighbors = getNeighbors(current.x, current.y, grid);

    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (closedSet.has(key)) continue;

      const terrain = grid[neighbor.y][neighbor.x].terrain;
      const terrainInfo = TERRAIN_INFO[terrain];
      if (!terrainInfo.passable) continue;

      const tentativeG = current.g + terrainInfo.moveCost;

      if (tentativeG > moveRange) continue;

      const existingNode = openList.find((n) => n.x === neighbor.x && n.y === neighbor.y);

      if (!existingNode) {
        const h = heuristic(neighbor.x, neighbor.y, endX, endY);
        const newNode: PathNode = {
          x: neighbor.x,
          y: neighbor.y,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };
        openList.push(newNode);
      } else if (tentativeG < existingNode.g) {
        existingNode.g = tentativeG;
        existingNode.f = tentativeG + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  return null;
}

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function getNeighbors(x: number, y: number, grid: GridCell[][]): { x: number; y: number }[] {
  const neighbors: { x: number; y: number }[] = [];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

function reconstructPath(node: PathNode): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  let current: PathNode | null = node;

  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}

export function getMovableCells(
  unit: Unit,
  grid: GridCell[][],
  units: Unit[]
): { x: number; y: number }[] {
  const movable: { x: number; y: number }[] = [];
  const occupied = new Set(units.filter((u) => u.isAlive).map((u) => `${u.position.x},${u.position.y}`));

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (x === unit.position.x && y === unit.position.y) continue;
      if (occupied.has(`${x},${y}`)) continue;

      const terrain = grid[y][x].terrain;
      if (!TERRAIN_INFO[terrain].passable) continue;

      const path = findPath(unit.position.x, unit.position.y, x, y, grid, unit.moveRange);
      if (path && path.length > 1) {
        movable.push({ x, y });
      }
    }
  }

  return movable;
}

export function calculateDamage(attacker: Unit, defender: Unit): { damage: number; originalDamage: number } {
  const baseDamage = Math.max(1, attacker.attack - defender.defense);
  const originalDamage = baseDamage;
  const randomFactor = 0.8 + Math.random() * 0.4;
  const damage = Math.max(1, Math.round(baseDamage * randomFactor));
  return { damage, originalDamage };
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function getEnemiesInRange(unit: Unit, units: Unit[]): Unit[] {
  return units.filter((u) => {
    if (!u.isAlive || u.team === unit.team) return false;
    const dist = getDistance(unit.position.x, unit.position.y, u.position.x, u.position.y);
    return dist <= unit.attackRange;
  });
}

export function findNearestEnemy(unit: Unit, units: Unit[]): Unit | null {
  const enemies = units.filter((u) => u.isAlive && u.team !== unit.team);
  if (enemies.length === 0) return null;

  let nearest = enemies[0];
  let minDist = getDistance(unit.position.x, unit.position.y, nearest.position.x, nearest.position.y);

  for (const enemy of enemies) {
    const dist = getDistance(unit.position.x, unit.position.y, enemy.position.x, enemy.position.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

export interface ExecuteTurnResult {
  logs: BattleLog[];
  units: Unit[];
}

export function executeUnitTurn(
  unit: Unit,
  units: Unit[],
  grid: GridCell[][],
  behaviorTree: BehaviorTree,
  turn: number
): {
  updatedUnit: Unit;
  updatedUnits: Unit[];
  logs: BattleLog[];
} {
  const logs: BattleLog[] = [];

  if (!unit.isAlive) {
    return { updatedUnit: unit, updatedUnits: units, logs };
  }

  const enemies = units.filter((u) => u.isAlive && u.team !== unit.team);

  const executionContext = {
    unit: {
      id: unit.id,
      hp: unit.hp,
      maxHp: unit.maxHp,
      position: { ...unit.position },
      attackRange: unit.attackRange,
      team: unit.team,
    },
    enemies: enemies.map((e) => ({
      id: e.id,
      position: { ...e.position },
      hp: e.hp,
      maxHp: e.maxHp,
    })),
    grid: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      isPassable: (x: number, y: number) => {
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
        return TERRAIN_INFO[grid[y][x].terrain].passable;
      },
      getDistance,
    },
  };

  const btResult = executeBehaviorTree(behaviorTree, executionContext);
  const action = btResult.action;
  const targetId = btResult.targetId;

  if (!action) {
    logs.push({
      id: uuidv4(),
      timestamp: Date.now(),
      turn,
      unitId: unit.id,
      unitName: unit.name,
      action: '待机',
      details: {},
    });
    return { updatedUnit: unit, updatedUnits: units, logs };
  }

  let updatedUnit = { ...unit };
  let updatedUnits = [...units];

  switch (action) {
    case 'move_to_target': {
      if (targetId) {
        const target = updatedUnits.find((u) => u.id === targetId);
        if (target && target.isAlive) {
          const result = moveUnitTowardsTarget(updatedUnit, target, grid, updatedUnits, turn);
          updatedUnit = result.updatedUnit;
          updatedUnits = updatedUnits.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
          logs.push(...result.logs);
        }
      }
      break;
    }
    case 'chase_nearest_enemy': {
      const nearest = findNearestEnemy(unit, units);
      if (nearest) {
        const result = moveUnitTowardsTarget(updatedUnit, nearest, grid, updatedUnits, turn);
        updatedUnit = result.updatedUnit;
        updatedUnits = updatedUnits.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
        logs.push(...result.logs);
      }
      break;
    }
    case 'attack_target': {
      if (targetId) {
        const target = updatedUnits.find((u) => u.id === targetId);
        if (target && target.isAlive) {
          const dist = getDistance(
            updatedUnit.position.x,
            updatedUnit.position.y,
            target.position.x,
            target.position.y
          );
          if (dist <= unit.attackRange) {
            const result = attackTarget(updatedUnit, target, updatedUnits, turn);
            updatedUnit = result.updatedAttacker;
            updatedUnits = result.updatedUnits;
            logs.push(result.log);
          }
        }
      }
      break;
    }
    case 'guard': {
      logs.push({
        id: uuidv4(),
        timestamp: Date.now(),
        turn,
        unitId: unit.id,
        unitName: unit.name,
        action: '守卫',
        details: {},
      });
      break;
    }
    case 'flee': {
      const result = fleeFromEnemies(updatedUnit, grid, updatedUnits, turn);
      updatedUnit = result.updatedUnit;
      updatedUnits = updatedUnits.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
      logs.push(...result.logs);
      break;
    }
  }

  return { updatedUnit, updatedUnits, logs };
}

function moveUnitTowardsTarget(
  unit: Unit,
  target: Unit,
  grid: GridCell[][],
  units: Unit[],
  turn: number
): { updatedUnit: Unit; logs: BattleLog[] } {
  const logs: BattleLog[] = [];

  const occupied = new Set(units.filter((u) => u.isAlive && u.id !== unit.id).map((u) => `${u.position.x},${u.position.y}`));

  let bestPos = { ...unit.position };
  let bestDist = getDistance(unit.position.x, unit.position.y, target.position.x, target.position.y);

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (x === unit.position.x && y === unit.position.y) continue;
      if (occupied.has(`${x},${y}`)) continue;

      const terrain = grid[y][x].terrain;
      if (!TERRAIN_INFO[terrain].passable) continue;

      const path = findPath(unit.position.x, unit.position.y, x, y, grid, unit.moveRange);
      if (!path || path.length <= 1) continue;

      const dist = getDistance(x, y, target.position.x, target.position.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = { x, y };
      }
    }
  }

  if (bestPos.x !== unit.position.x || bestPos.y !== unit.position.y) {
    const fromPos = { ...unit.position };
    const updatedUnit = { ...unit, position: { ...bestPos } };

    const terrain = grid[bestPos.y][bestPos.x].terrain;

    logs.push({
      id: uuidv4(),
      timestamp: Date.now(),
      turn,
      unitId: unit.id,
      unitName: unit.name,
      action: '移动',
      details: {
        from: fromPos,
        to: bestPos,
        terrain,
      },
    });

    return { updatedUnit, logs };
  }

  return { updatedUnit: unit, logs };
}

function fleeFromEnemies(
  unit: Unit,
  grid: GridCell[][],
  units: Unit[],
  turn: number
): { updatedUnit: Unit; logs: BattleLog[] } {
  const logs: BattleLog[] = [];
  const enemies = units.filter((u) => u.isAlive && u.team !== unit.team);

  if (enemies.length === 0) {
    return { updatedUnit: unit, logs };
  }

  const occupied = new Set(units.filter((u) => u.isAlive && u.id !== unit.id).map((u) => `${u.position.x},${u.position.y}`));

  let bestPos = { ...unit.position };
  let bestMinDist = 0;

  for (const enemy of enemies) {
    bestMinDist += getDistance(unit.position.x, unit.position.y, enemy.position.x, enemy.position.y);
  }

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (x === unit.position.x && y === unit.position.y) continue;
      if (occupied.has(`${x},${y}`)) continue;

      const terrain = grid[y][x].terrain;
      if (!TERRAIN_INFO[terrain].passable) continue;

      const path = findPath(unit.position.x, unit.position.y, x, y, grid, unit.moveRange);
      if (!path || path.length <= 1) continue;

      let totalDist = 0;
      for (const enemy of enemies) {
        totalDist += getDistance(x, y, enemy.position.x, enemy.position.y);
      }

      if (totalDist > bestMinDist) {
        bestMinDist = totalDist;
        bestPos = { x, y };
      }
    }
  }

  if (bestPos.x !== unit.position.x || bestPos.y !== unit.position.y) {
    const fromPos = { ...unit.position };
    const updatedUnit = { ...unit, position: { ...bestPos } };

    logs.push({
      id: uuidv4(),
      timestamp: Date.now(),
      turn,
      unitId: unit.id,
      unitName: unit.name,
      action: '撤退',
      details: {
        from: fromPos,
        to: bestPos,
      },
    });

    return { updatedUnit, logs };
  }

  return { updatedUnit: unit, logs };
}

function attackTarget(
  attacker: Unit,
  target: Unit,
  units: Unit[],
  turn: number
): { updatedAttacker: Unit; updatedUnits: Unit[]; log: BattleLog } {
  const { damage, originalDamage } = calculateDamage(attacker, target);

  const updatedTarget = {
    ...target,
    hp: Math.max(0, target.hp - damage),
    isAlive: target.hp - damage > 0,
  };

  const updatedUnits = units.map((u) => (u.id === target.id ? updatedTarget : u));

  const log: BattleLog = {
    id: uuidv4(),
    timestamp: Date.now(),
    turn,
    unitId: attacker.id,
    unitName: attacker.name,
    action: '攻击',
    details: {
      targetId: target.id,
      targetName: target.name,
      damage,
      originalDamage,
      remainingHp: updatedTarget.hp,
    },
  };

  return { updatedAttacker: attacker, updatedUnits, log };
}

export function checkBattleEnd(units: Unit[]): 'red' | 'blue' | null {
  const redAlive = units.some((u) => u.team === 'red' && u.isAlive);
  const blueAlive = units.some((u) => u.team === 'blue' && u.isAlive);

  if (!redAlive && !blueAlive) return null;
  if (!redAlive) return 'blue';
  if (!blueAlive) return 'red';
  return null;
}
