import {
  EventBus,
  LevelData,
  GridCell,
  CaveData,
  Position,
  PoisonMushroom,
  WanderingBat,
  Crystal,
} from './types';

const CELL_SIZE = 45;
const GRID_WIDTH = 25;
const GRID_HEIGHT = 25;
const CAVE_COUNT = 5;
const VISIBILITY_RADIUS = 5;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class CaveLevelBuilder {
  private eventBus: EventBus;
  private levelData: LevelData | null = null;
  private mushroomIdCounter = 0;
  private batIdCounter = 0;
  private crystalIdCounter = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public generateLevel(): LevelData {
    this.mushroomIdCounter = 0;
    this.batIdCounter = 0;
    this.crystalIdCounter = 0;

    const grid: GridCell[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        row.push({
          type: 'wall',
          visible: false,
          explored: false,
          caveIndex: -1,
        });
      }
      grid.push(row);
    }

    const caves = this.generateCaves(grid);
    this.connectCaves(grid, caves);
    this.placeCrystals(caves);
    this.placeEnemies(grid, caves);
    this.placePortal(grid, caves);
    this.markVisibilityAround(grid, caves[2].startPos, VISIBILITY_RADIUS);

    const levelData: LevelData = {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      cellSize: CELL_SIZE,
      grid,
      caves,
      portal: caves[2].isCenter
        ? { ...caves[2].startPos }
        : caves.find((c) => c.isCenter)?.startPos ?? caves[0].startPos,
    };

    if (levelData.portal) {
      const { x, y } = levelData.portal;
      grid[y][x].type = 'portal';
    }

    this.levelData = levelData;
    this.eventBus.emit({
      type: 'level:ready',
      payload: { levelData },
    });

    return levelData;
  }

  private generateCaves(grid: GridCell[][]): CaveData[] {
    const caves: CaveData[] = [];
    const usedAreas: { minX: number; minY: number; maxX: number; maxY: number }[] = [];
    const caveSizeMin = 5;
    const caveSizeMax = 7;
    const margin = 2;

    const positions: { col: number; row: number }[] = [
      { col: 0, row: 1 },
      { col: 1, row: 0 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 1, row: 2 },
    ];

    const regionW = Math.floor(GRID_WIDTH / 3);
    const regionH = Math.floor(GRID_HEIGHT / 3);

    for (let i = 0; i < CAVE_COUNT; i++) {
      const pos = positions[i];
      const isCenter = i === 2;

      let attempt = 0;
      while (attempt < 50) {
        const w = randInt(caveSizeMin, caveSizeMax);
        const h = randInt(caveSizeMin, caveSizeMax);
        const minX = Math.max(
          margin,
          pos.col * regionW + randInt(margin, Math.max(margin, regionW - w - margin))
        );
        const minY = Math.max(
          margin,
          pos.row * regionH + randInt(margin, Math.max(margin, regionH - h - margin))
        );
        const maxX = Math.min(GRID_WIDTH - margin - 1, minX + w - 1);
        const maxY = Math.min(GRID_HEIGHT - margin - 1, minY + h - 1);

        let overlap = false;
        for (const area of usedAreas) {
          if (
            minX - margin <= area.maxX &&
            maxX + margin >= area.minX &&
            minY - margin <= area.maxY &&
            maxY + margin >= area.minY
          ) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          usedAreas.push({ minX, minY, maxX, maxY });
          const bounds = { minX, minY, maxX, maxY };

          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              grid[y][x] = {
                type: 'empty',
                visible: false,
                explored: false,
                caveIndex: i,
              };
            }
          }

          const startPos = {
            x: randInt(minX + 1, maxX - 1),
            y: randInt(minY + 1, maxY - 1),
          };
          grid[startPos.y][startPos.x].type = isCenter ? 'start' : 'start';

          const exitPositions: Position[] = [];
          const numExits = isCenter ? 4 : randInt(1, 2);

          const cave: CaveData = {
            index: i,
            bounds,
            startPos,
            exitPositions,
            crystal: {
              id: ++this.crystalIdCounter,
              gridX: 0,
              gridY: 0,
              caveIndex: i,
              collected: false,
            },
            mushrooms: [],
            wanderingBats: [],
            isCenter,
          };

          cave.exitPositions = exitPositions;
          (cave as { _numExits?: number })._numExits = numExits;
          caves.push(cave);
          break;
        }
        attempt++;
      }
    }

    return caves;
  }

  private connectCaves(grid: GridCell[][], caves: CaveData[]): void {
    const connections: [number, number][] = [
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
    ];

    for (const [a, b] of connections) {
      if (a >= caves.length || b >= caves.length) continue;
      const caveA = caves[a];
      const caveB = caves[b];
      this.carveCorridor(grid, caveA, caveB);
    }
  }

  private carveCorridor(grid: GridCell[][], caveA: CaveData, caveB: CaveData): void {
    const ax = Math.floor((caveA.bounds.minX + caveA.bounds.maxX) / 2);
    const ay = Math.floor((caveA.bounds.minY + caveA.bounds.maxY) / 2);
    const bx = Math.floor((caveB.bounds.minX + caveB.bounds.maxX) / 2);
    const by = Math.floor((caveB.bounds.minY + caveB.bounds.maxY) / 2);

    let x = ax;
    let y = ay;

    while (x !== bx) {
      this.carveCell(grid, x, y);
      this.carveCell(grid, x, y + 1);
      x += x < bx ? 1 : -1;
    }
    while (y !== by) {
      this.carveCell(grid, x, y);
      this.carveCell(grid, x + 1, y);
      y += y < by ? 1 : -1;
    }
    this.carveCell(grid, bx, by);

    const isExitInA = (gx: number, gy: number) =>
      gx >= caveA.bounds.minX &&
      gx <= caveA.bounds.maxX &&
      gy >= caveA.bounds.minY &&
      gy <= caveA.bounds.maxY;

    const isExitInB = (gx: number, gy: number) =>
      gx >= caveB.bounds.minX &&
      gx <= caveB.bounds.maxX &&
      gy >= caveB.bounds.minY &&
      gy <= caveB.bounds.maxY;

    for (let cx = Math.min(ax, bx); cx <= Math.max(ax, bx); cx++) {
      if (isExitInA(cx, ay) && grid[ay][cx].type === 'empty') {
        grid[ay][cx].type = 'exit';
        caveA.exitPositions.push({ x: cx, y: ay });
        break;
      }
    }
    for (let cy = Math.min(ay, by); cy <= Math.max(ay, by); cy++) {
      if (isExitInA(bx, cy) && grid[cy][bx].type === 'empty' && caveA.exitPositions.length < 2) {
        grid[cy][bx].type = 'exit';
        caveA.exitPositions.push({ x: bx, y: cy });
        break;
      }
    }

    for (let cx = Math.min(ax, bx); cx <= Math.max(ax, bx); cx++) {
      if (isExitInB(cx, by) && grid[by][cx].type === 'empty') {
        grid[by][cx].type = 'exit';
        caveB.exitPositions.push({ x: cx, y: by });
        break;
      }
    }
    for (let cy = Math.min(ay, by); cy <= Math.max(ay, by); cy++) {
      if (isExitInB(ax, cy) && grid[cy][ax].type === 'empty' && caveB.exitPositions.length < 2) {
        grid[cy][ax].type = 'exit';
        caveB.exitPositions.push({ x: ax, y: cy });
        break;
      }
    }
  }

  private carveCell(grid: GridCell[][], x: number, y: number): void {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;
    if (grid[y][x].type === 'wall') {
      grid[y][x] = {
        type: 'empty',
        visible: false,
        explored: false,
        caveIndex: -1,
      };
    }
  }

  private placeCrystals(caves: CaveData[]): void {
    for (const cave of caves) {
      const positions: Position[] = [];
      for (let y = cave.bounds.minY; y <= cave.bounds.maxY; y++) {
        for (let x = cave.bounds.minX; x <= cave.bounds.maxX; x++) {
          const distFromStart = Math.hypot(x - cave.startPos.x, y - cave.startPos.y);
          if (distFromStart >= 2) {
            positions.push({ x, y });
          }
        }
      }
      if (positions.length > 0) {
        const pos = randChoice(positions);
        cave.crystal.gridX = pos.x;
        cave.crystal.gridY = pos.y;
      } else {
        cave.crystal.gridX = cave.startPos.x;
        cave.crystal.gridY = cave.startPos.y;
      }
    }
  }

  private placeEnemies(grid: GridCell[][], caves: CaveData[]): void {
    for (const cave of caves) {
      const emptyPositions: Position[] = [];
      for (let y = cave.bounds.minY; y <= cave.bounds.maxY; y++) {
        for (let x = cave.bounds.minX; x <= cave.bounds.maxX; x++) {
          const isStart = x === cave.startPos.x && y === cave.startPos.y;
          const isCrystal = x === cave.crystal.gridX && y === cave.crystal.gridY;
          if (grid[y][x].type === 'empty' && !isStart && !isCrystal) {
            emptyPositions.push({ x, y });
          }
        }
      }
      this.shuffle(emptyPositions);

      const mushroomCount = randInt(1, 3);
      for (let i = 0; i < mushroomCount && i < emptyPositions.length; i++) {
        const pos = emptyPositions[i];
        const mushroom: PoisonMushroom = {
          id: ++this.mushroomIdCounter,
          gridX: pos.x,
          gridY: pos.y,
          stunned: false,
          stunEndTime: 0,
          knockbackDir: null,
        };
        cave.mushrooms.push(mushroom);
      }
      emptyPositions.splice(0, mushroomCount);

      const batCount = cave.isCenter ? randInt(1, 2) : randInt(0, 1);
      for (let i = 0; i < batCount && i + 4 < emptyPositions.length; i++) {
        const path: Position[] = [];
        const pathLen = randInt(3, 5);
        let current = emptyPositions[i * 4] || emptyPositions[i];
        for (let j = 0; j < pathLen; j++) {
          path.push({ ...current });
          const neighbors = this.getWalkableNeighbors(grid, current).filter(
            (n) => !path.some((p) => p.x === n.x && p.y === n.y)
          );
          if (neighbors.length > 0) {
            current = randChoice(neighbors);
          } else {
            break;
          }
        }
        if (path.length >= 2) {
          const start = path[0];
          const bat: WanderingBat = {
            id: ++this.batIdCounter,
            gridX: start.x,
            gridY: start.y,
            path,
            pathIndex: 0,
            moveProgress: 0,
            stunned: false,
            stunEndTime: 0,
          };
          cave.wanderingBats.push(bat);
        }
      }
    }
  }

  private placePortal(grid: GridCell[][], caves: CaveData[]): void {
    const centerCave = caves.find((c) => c.isCenter) || caves[2];
    let portalPos = centerCave.startPos;
    for (let y = centerCave.bounds.minY; y <= centerCave.bounds.maxY; y++) {
      for (let x = centerCave.bounds.minX; x <= centerCave.bounds.maxX; x++) {
        if (
          grid[y][x].type === 'empty' &&
          !(x === centerCave.crystal.gridX && y === centerCave.crystal.gridY) &&
          !(x === centerCave.startPos.x && y === centerCave.startPos.y)
        ) {
          portalPos = { x, y };
          break;
        }
      }
    }
    grid[portalPos.y][portalPos.x].type = 'portal';
  }

  private getWalkableNeighbors(grid: GridCell[][], pos: Position): Position[] {
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];
    const result: Position[] = [];
    for (const d of dirs) {
      const nx = pos.x + d.x;
      const ny = pos.y + d.y;
      if (
        nx >= 0 &&
        nx < GRID_WIDTH &&
        ny >= 0 &&
        ny < GRID_HEIGHT &&
        grid[ny][nx].type !== 'wall'
      ) {
        result.push({ x: nx, y: ny });
      }
    }
    return result;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private markVisibilityAround(
    grid: GridCell[][],
    center: Position,
    radius: number
  ): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const gx = center.x + dx;
          const gy = center.y + dy;
          if (gx >= 0 && gx < GRID_WIDTH && gy >= 0 && gy < GRID_HEIGHT) {
            grid[gy][gx].visible = true;
            grid[gy][gx].explored = true;
          }
        }
      }
    }
  }

  public updateVisibility(
    grid: GridCell[][],
    playerGridPos: Position,
    sonarRevealed: Position[]
  ): void {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x].visible = grid[y][x].explored;
      }
    }

    const r = VISIBILITY_RADIUS;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const gx = playerGridPos.x + dx;
          const gy = playerGridPos.y + dy;
          if (gx >= 0 && gx < GRID_WIDTH && gy >= 0 && gy < GRID_HEIGHT) {
            grid[gy][gx].visible = true;
            grid[gy][gx].explored = true;
          }
        }
      }
    }

    for (const p of sonarRevealed) {
      if (p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT) {
        grid[p.y][p.x].visible = true;
        grid[p.y][p.x].explored = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const gx = p.x + dx;
            const gy = p.y + dy;
            if (gx >= 0 && gx < GRID_WIDTH && gy >= 0 && gy < GRID_HEIGHT) {
              grid[gy][gx].visible = true;
              grid[gy][gx].explored = true;
            }
          }
        }
      }
    }
  }

  public getCellSize(): number {
    return CELL_SIZE;
  }

  public getLevelData(): LevelData | null {
    return this.levelData;
  }

  public getVisibilityRadius(): number {
    return VISIBILITY_RADIUS;
  }
}
