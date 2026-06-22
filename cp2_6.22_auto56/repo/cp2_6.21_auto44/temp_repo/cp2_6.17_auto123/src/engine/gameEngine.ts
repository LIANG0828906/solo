import type { Cell, Monster, Tower, TowerType, TowerStats, WaveConfig, StatusEffect } from '../types';
import { MonsterManager } from './monsterManager';
import { v4 as uuidv4 } from 'uuid';

export const TOWER_DEFS: Record<TowerType, {
  type: TowerType;
  name: string;
  cost: number;
  color: string;
  stats: TowerStats;
}> = {
  arrow: {
    type: 'arrow',
    name: '箭塔',
    cost: 50,
    color: '#696969',
    stats: {
      damage: 8,
      range: 3,
      attackInterval: 0.6,
    },
  },
  fire: {
    type: 'fire',
    name: '火焰塔',
    cost: 100,
    color: '#8B0000',
    stats: {
      damage: 15,
      range: 2.5,
      attackInterval: 1,
      burnDamage: 3,
      burnDuration: 3,
    },
  },
};

export const GRID_COLS = 15;
export const GRID_ROWS = 10;
export const TOTAL_WAVES = 5;
export const WAVE_MONSTER_COUNTS = [10, 15, 20, 25, 30];

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

class MinHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  size(): number {
    return this.heap.length;
  }

  clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

export function generateSPath(cols: number, rows: number): Cell[] {
  const path: Cell[] = [];

  const startX = 0;
  const startY = Math.floor(rows / 2);

  let x = startX;
  let y = startY;

  path.push({ x, y, type: 'path' });

  const segments = 3;
  const segmentWidth = Math.floor((cols - 1) / segments);

  for (let s = 0; s < segments; s++) {
    const isEvenSegment = s % 2 === 0;
    const targetX = s === segments - 1 ? cols - 1 : x + segmentWidth;
    const targetY = isEvenSegment ? 1 : rows - 2;

    while (x < targetX) {
      x++;
      path.push({ x, y, type: 'path' });
    }

    if (s < segments - 1) {
      const step = isEvenSegment ? -1 : 1;
      while (y !== targetY) {
        y += step;
        path.push({ x, y, type: 'path' });
      }
    }
  }

  return path;
}

export function findPathAStar(
  cols: number,
  rows: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
  isBlocked: (x: number, y: number) => boolean
): Cell[] {
  if (start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows) {
    console.error(`[AStar] 起点坐标超出范围: (${start.x}, ${start.y}), 网格大小: ${cols}x${rows}`);
    return [];
  }
  if (end.x < 0 || end.x >= cols || end.y < 0 || end.y >= rows) {
    console.error(`[AStar] 终点坐标超出范围: (${end.x}, ${end.y}), 网格大小: ${cols}x${rows}`);
    return [];
  }
  if (isBlocked(start.x, start.y)) {
    console.error(`[AStar] 起点 (${start.x}, ${start.y}) 是障碍物`);
    return [];
  }
  if (isBlocked(end.x, end.y)) {
    console.error(`[AStar] 终点 (${end.x}, ${end.y}) 是障碍物`);
    return [];
  }

  const heuristic = (a: PathNode, b: PathNode): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  const openList = new MinHeap<PathNode>((a, b) => a.f - b.f);
  const closedList: Set<string> = new Set();
  const nodeMap: Map<string, PathNode> = new Map();

  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  };
  const endNode: PathNode = {
    x: end.x,
    y: end.y,
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  };

  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);
  nodeMap.set(`${start.x},${start.y}`, startNode);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  let exploredNodes = 0;
  const maxExplored = cols * rows * 2;

  while (openList.size() > 0) {
    const current = openList.pop()!;
    const currentKey = `${current.x},${current.y}`;
    exploredNodes++;

    if (exploredNodes > maxExplored) {
      console.error(`[AStar] 探索节点数超过上限 ${maxExplored}，可能存在异常`);
      return [];
    }

    if (current.x === end.x && current.y === end.y) {
      const path: Cell[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y, type: 'path' });
        node = node.parent;
      }
      return path;
    }

    closedList.add(currentKey);

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const neighborKey = `${nx},${ny}`;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (isBlocked(nx, ny)) continue;
      if (closedList.has(neighborKey)) continue;

      const g = current.g + 1;
      const existingNode = nodeMap.get(neighborKey);

      if (!existingNode || g < existingNode.g) {
        const neighbor: PathNode = existingNode || {
          x: nx,
          y: ny,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
        };
        neighbor.g = g;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;

        nodeMap.set(neighborKey, neighbor);

        if (!existingNode) {
          openList.push(neighbor);
        } else {
          openList.push(neighbor);
        }
      }
    }
  }

  console.error(`[AStar] 未找到路径: 从 (${start.x}, ${start.y}) 到 (${end.x}, ${end.y}), 已探索 ${exploredNodes} 个节点`);
  return [];
}

export function generatePath(cols: number, rows: number): Cell[] {
  return generateSPath(cols, rows);
}

export function buildCells(cols: number, rows: number, path: Cell[]): Cell[][] {
  const pathSet = new Set(path.map((c) => `${c.x},${c.y}`));
  const cells: Cell[][] = [];

  for (let y = 0; y < rows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      row.push({
        x,
        y,
        type: pathSet.has(key) ? 'path' : 'buildable',
      });
    }
    cells.push(row);
  }

  return cells;
}

export function getWaveConfig(waveNumber: number): WaveConfig {
  const totalMonsters = WAVE_MONSTER_COUNTS[waveNumber - 1] || 10;
  let eliteRatio = 0;
  let hasBoss = false;

  if (waveNumber >= 3) {
    eliteRatio = 0.2;
  }
  if (waveNumber === 5) {
    hasBoss = true;
  }

  return {
    waveNumber,
    totalMonsters,
    eliteRatio,
    hasBoss,
    spawnInterval: 0.8,
  };
}

export function getTowerStats(type: TowerType, level: number): TowerStats {
  const def = TOWER_DEFS[type];
  const multiplier = 1 + (level - 1) * 0.15;

  return {
    damage: def.stats.damage * multiplier,
    range: def.stats.range * multiplier,
    attackInterval: def.stats.attackInterval,
    burnDamage: def.stats.burnDamage ? def.stats.burnDamage * multiplier : undefined,
    burnDuration: def.stats.burnDuration,
  };
}

export function getUpgradeCost(type: TowerType, level: number): number {
  const baseCost = TOWER_DEFS[type].cost;
  return Math.floor(baseCost * 0.6 * level);
}

export function getSellValue(type: TowerType, level: number): number {
  const baseCost = TOWER_DEFS[type].cost;
  let totalCost = baseCost;
  for (let l = 1; l < level; l++) {
    totalCost += getUpgradeCost(type, l);
  }
  return Math.floor(totalCost * 0.5);
}

export class GameEngine {
  private monsterManager: MonsterManager;
  private path: Cell[] = [];
  private cols: number;
  private rows: number;
  private towers: Map<string, Tower> = new Map();
  private cells: Cell[][] = [];
  private wave: number = 0;
  private gold: number = 200;
  private lives: number = 20;
  private waveActive: boolean = false;
  private gameOver: boolean = false;
  private victory: boolean = false;

  constructor(cols: number = GRID_COLS, rows: number = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.monsterManager = new MonsterManager();
    this.initialize();
  }

  initialize(): void {
    this.path = generatePath(this.cols, this.rows);
    this.cells = buildCells(this.cols, this.rows, this.path);
    this.monsterManager.setPath(this.path);
    this.monsterManager.setHpMultiplier(1);
    this.wave = 0;
    this.gold = 200;
    this.lives = 20;
    this.waveActive = false;
    this.gameOver = false;
    this.victory = false;
    this.towers.clear();
    this.monsterManager.clearAll();
  }

  reset(): void {
    this.initialize();
  }

  getPath(): Cell[] {
    return this.path;
  }

  getCells(): Cell[][] {
    return this.cells;
  }

  canPlaceTower(x: number, y: number): boolean {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    if (this.cells[y][x].type === 'path') return false;
    if (this.cells[y][x].type === 'tower') return false;
    return true;
  }

  placeTower(x: number, y: number, type: TowerType): Tower | null {
    if (!this.canPlaceTower(x, y)) return null;

    const def = TOWER_DEFS[type];
    if (this.gold < def.cost) return null;

    const tower: Tower = {
      id: uuidv4(),
      type,
      x,
      y,
      level: 1,
      lastAttackTime: 0,
      targetId: null,
    };

    this.towers.set(tower.id, tower);
    this.cells[y][x] = { ...this.cells[y][x], type: 'tower' };
    this.gold -= def.cost;

    return tower;
  }

  upgradeTower(towerId: string): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) return false;
    if (tower.level >= 3) return false;

    const cost = getUpgradeCost(tower.type, tower.level);
    if (this.gold < cost) return false;

    tower.level += 1;
    this.gold -= cost;
    return true;
  }

  sellTower(towerId: string): number {
    const tower = this.towers.get(towerId);
    if (!tower) return 0;

    const value = getSellValue(tower.type, tower.level);
    this.cells[tower.y][tower.x] = { ...this.cells[tower.y][tower.x], type: 'buildable' };
    this.towers.delete(towerId);
    this.gold += value;
    return value;
  }

  getTower(towerId: string): Tower | undefined {
    return this.towers.get(towerId);
  }

  getAllTowers(): Tower[] {
    return Array.from(this.towers.values());
  }

  startWave(): boolean {
    if (this.waveActive) return false;
    if (this.wave >= TOTAL_WAVES) return false;

    this.wave += 1;
    const config = getWaveConfig(this.wave);
    const hpMultiplier = 1 + (this.wave - 1) * 0.1;
    this.monsterManager.setHpMultiplier(hpMultiplier);
    this.monsterManager.prepareWave(config);
    this.waveActive = true;

    return true;
  }

  update(currentTime: number, deltaTime: number): void {
    if (this.gameOver || this.victory) return;

    const { goldEarned, livesLost } = this.monsterManager.update(deltaTime);
    this.gold += goldEarned;
    this.lives -= livesLost;

    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
      return;
    }

    const monsters = this.monsterManager.getAllMonsters();
    for (const tower of this.towers.values()) {
      this.processTowerAttack(tower, monsters, currentTime);
    }

    if (this.waveActive && this.monsterManager.isWaveComplete()) {
      this.waveActive = false;
      this.gold += 50;

      if (this.wave >= TOTAL_WAVES) {
        this.victory = true;
      }
    }
  }

  private processTowerAttack(tower: Tower, monsters: Monster[], currentTime: number): void {
    const stats = getTowerStats(tower.type, tower.level);
    const elapsed = currentTime - tower.lastAttackTime;

    if (elapsed < stats.attackInterval * 1000) return;

    const targetsInRange = monsters.filter((m) => {
      const dx = m.x - tower.x;
      const dy = m.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= stats.range;
    });

    if (targetsInRange.length === 0) {
      tower.targetId = null;
      return;
    }

    targetsInRange.sort((a, b) => a.hp - b.hp);

    const target = targetsInRange[0];
    tower.targetId = target.id;
    tower.lastAttackTime = currentTime;

    const effect: StatusEffect | undefined = stats.burnDamage && stats.burnDuration
      ? { type: 'burn', damage: stats.burnDamage, remainingTime: stats.burnDuration }
      : undefined;

    this.monsterManager.applyDamage(target.id, stats.damage, effect);
  }

  getMonsters(): Monster[] {
    return this.monsterManager.getAllMonsters();
  }

  getWave(): number {
    return this.wave;
  }

  getGold(): number {
    return this.gold;
  }

  getLives(): number {
    return this.lives;
  }

  isWaveActive(): boolean {
    return this.waveActive;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  isVictory(): boolean {
    return this.victory;
  }

  getMonsterCount(): number {
    return this.monsterManager.getActiveCount() + this.monsterManager.getQueueCount();
  }

  getCols(): number {
    return this.cols;
  }

  getRows(): number {
    return this.rows;
  }
}
