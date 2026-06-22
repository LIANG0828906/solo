export type WallMaterial = 'stone' | 'wood' | 'crystal';
export type ChestType = 'normal' | 'rare' | 'legendary';
export type Frequency = 'low' | 'mid' | 'high';

export interface Walls {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface ChestContent {
  type: 'chest';
  chestType: ChestType;
  collected: boolean;
}

export interface TrapContent {
  type: 'trap';
  triggered: boolean;
}

export type CellContent = ChestContent | TrapContent;

export interface Cell {
  x: number;
  y: number;
  walls: Walls;
  wallMaterial: WallMaterial;
  explored: boolean;
  content: CellContent | null;
}

export interface PlayerState {
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  targetPixelX: number;
  targetPixelY: number;
  moving: boolean;
  moveProgress: number;
  startPixelX: number;
  startPixelY: number;
  hp: number;
  maxHp: number;
  chestsCollected: number;
  dead: boolean;
  won: boolean;
}

export interface ReflectionData {
  wallPixelX: number;
  wallPixelY: number;
  direction: number;
  wallMaterial: WallMaterial;
  age: number;
  maxAge: number;
}

export interface ChestRevealData {
  gridX: number;
  gridY: number;
  age: number;
  maxAge: number;
}

export const GRID_SIZE = 12;
export const CELL_SIZE = 64;
export const MAZE_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;

export class MazeEngine {
  grid: Cell[][];
  player: PlayerState;
  exitX: number;
  exitY: number;
  exitOpen: boolean;
  reflections: ReflectionData[];
  chestReveals: ChestRevealData[];
  exploredCells: Set<string>;
  damageFlash: number;
  offsetX: number = 0;
  offsetY: number = 0;
  totalChests: number = 3;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.grid = this.generateMaze();
    this.offsetX = Math.floor((canvasWidth - MAZE_PIXEL_SIZE) / 2);
    this.offsetY = Math.floor((canvasHeight - MAZE_PIXEL_SIZE) / 2);
    this.player = {
      gridX: 0,
      gridY: 0,
      pixelX: this.offsetX + CELL_SIZE / 2,
      pixelY: this.offsetY + CELL_SIZE / 2,
      targetPixelX: this.offsetX + CELL_SIZE / 2,
      targetPixelY: this.offsetY + CELL_SIZE / 2,
      startPixelX: this.offsetX + CELL_SIZE / 2,
      startPixelY: this.offsetY + CELL_SIZE / 2,
      moving: false,
      moveProgress: 0,
      hp: 100,
      maxHp: 100,
      chestsCollected: 0,
      dead: false,
      won: false
    };
    this.exitX = GRID_SIZE - 1;
    this.exitY = GRID_SIZE - 1;
    this.exitOpen = false;
    this.reflections = [];
    this.chestReveals = [];
    this.exploredCells = new Set();
    this.damageFlash = 0;
    this.placeContent();
    this.markExplored(0, 0);
  }

  generateMaze(): Cell[][] {
    const grid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const materials: WallMaterial[] = ['stone', 'wood', 'crystal'];
        grid[y][x] = {
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          wallMaterial: materials[Math.floor(Math.random() * 3)],
          explored: false,
          content: null
        };
      }
    }

    const visited = new Set<string>();
    const stack: [number, number][] = [[0, 0]];
    visited.add('0,0');

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(cx, cy, visited);
      if (neighbors.length === 0) {
        stack.pop();
        continue;
      }
      const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
      this.removeWallBetween(grid, cx, cy, nx, ny);
      visited.add(`${nx},${ny}`);
      stack.push([nx, ny]);
    }

    return grid;
  }

  getUnvisitedNeighbors(x: number, y: number, visited: Set<string>): [number, number][] {
    const neighbors: [number, number][] = [];
    const dirs: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !visited.has(`${nx},${ny}`)) {
        neighbors.push([nx, ny]);
      }
    }
    return neighbors;
  }

  removeWallBetween(grid: Cell[][], cx: number, cy: number, nx: number, ny: number): void {
    const dx = nx - cx;
    const dy = ny - cy;
    if (dx === 1) {
      grid[cy][cx].walls.right = false;
      grid[ny][nx].walls.left = false;
    } else if (dx === -1) {
      grid[cy][cx].walls.left = false;
      grid[ny][nx].walls.right = false;
    } else if (dy === 1) {
      grid[cy][cx].walls.bottom = false;
      grid[ny][nx].walls.top = false;
    } else if (dy === -1) {
      grid[cy][cx].walls.top = false;
      grid[ny][nx].walls.bottom = false;
    }
  }

  placeContent(): void {
    const available: [number, number][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if ((x === 0 && y === 0) || (x === this.exitX && y === this.exitY)) continue;
        available.push([x, y]);
      }
    }
    this.shuffleArray(available);

    const chestTypes: ChestType[] = ['normal', 'rare', 'legendary'];
    for (let i = 0; i < 3; i++) {
      const [x, y] = available[i];
      this.grid[y][x].content = {
        type: 'chest',
        chestType: chestTypes[i],
        collected: false
      };
    }

    const trapCount = 6;
    for (let i = 3; i < 3 + trapCount && i < available.length; i++) {
      const [x, y] = available[i];
      this.grid[y][x].content = {
        type: 'trap',
        triggered: false
      };
    }
  }

  shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  markExplored(gx: number, gy: number): void {
    const radius = 2;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius + 0.5) {
            const key = `${nx},${ny}`;
            if (!this.exploredCells.has(key)) {
              this.exploredCells.add(key);
              this.grid[ny][nx].explored = true;
            }
          }
        }
      }
    }
  }

  canMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (toX < 0 || toX >= GRID_SIZE || toY < 0 || toY >= GRID_SIZE) return false;
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
    const cell = this.grid[fromY][fromX];
    if (dx === 1 && cell.walls.right) return false;
    if (dx === -1 && cell.walls.left) return false;
    if (dy === 1 && cell.walls.bottom) return false;
    if (dy === -1 && cell.walls.top) return false;
    return true;
  }

  movePlayerTo(toX: number, toY: number): boolean {
    if (this.player.moving || this.player.dead || this.player.won) return false;
    if (!this.canMove(this.player.gridX, this.player.gridY, toX, toY)) return false;
    this.player.startPixelX = this.player.pixelX;
    this.player.startPixelY = this.player.pixelY;
    this.player.gridX = toX;
    this.player.gridY = toY;
    this.player.targetPixelX = this.offsetX + toX * CELL_SIZE + CELL_SIZE / 2;
    this.player.targetPixelY = this.offsetY + toY * CELL_SIZE + CELL_SIZE / 2;
    this.player.moving = true;
    this.player.moveProgress = 0;
    return true;
  }

  updatePlayerMove(dt: number): boolean {
    if (!this.player.moving) return false;
    this.player.moveProgress += dt / 0.3;
    if (this.player.moveProgress >= 1) {
      this.player.moveProgress = 1;
      this.player.pixelX = this.player.targetPixelX;
      this.player.pixelY = this.player.targetPixelY;
      this.player.moving = false;
      this.onPlayerArrived();
      return true;
    }
    const t = 1 - Math.pow(1 - this.player.moveProgress, 3);
    this.player.pixelX = this.player.startPixelX + (this.player.targetPixelX - this.player.startPixelX) * t;
    this.player.pixelY = this.player.startPixelY + (this.player.targetPixelY - this.player.startPixelY) * t;
    return true;
  }

  onPlayerArrived(): void {
    this.markExplored(this.player.gridX, this.player.gridY);
    const cell = this.grid[this.player.gridY][this.player.gridX];
    if (cell.content) {
      if (cell.content.type === 'chest' && !cell.content.collected) {
        cell.content.collected = true;
        const hpMap: Record<ChestType, number> = { normal: 10, rare: 20, legendary: 30 };
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + hpMap[cell.content.chestType]);
        this.player.chestsCollected++;
        if (this.player.chestsCollected >= this.totalChests) {
          this.exitOpen = true;
        }
      } else if (cell.content.type === 'trap' && !cell.content.triggered) {
        cell.content.triggered = true;
        this.player.hp = Math.max(0, this.player.hp - 15);
        this.damageFlash = 0.3;
        if (this.player.hp <= 0) {
          this.player.dead = true;
        }
      }
    }
    if (this.exitOpen && this.player.gridX === this.exitX && this.player.gridY === this.exitY) {
      this.player.won = true;
    }
  }

  getAdjacentCell(clickPixelX: number, clickPixelY: number): { gx: number; gy: number } | null {
    const mx = clickPixelX - this.offsetX;
    const my = clickPixelY - this.offsetY;
    const gx = Math.floor(mx / CELL_SIZE);
    const gy = Math.floor(my / CELL_SIZE);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return null;
    return { gx, gy };
  }

  getClickDirection(clickPixelX: number, clickPixelY: number): number {
    const dx = clickPixelX - this.player.pixelX;
    const dy = clickPixelY - this.player.pixelY;
    return Math.atan2(dy, dx);
  }

  findWallHit(ox: number, oy: number, angle: number): { hitX: number; hitY: number; wallMaterial: WallMaterial; cellX: number; cellY: number } | null {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const step = 2;
    const maxDist = MAZE_PIXEL_SIZE * 1.5;
    let px = ox;
    let py = oy;
    let prevGx = -1;
    let prevGy = -1;
    for (let d = 0; d < maxDist; d += step) {
      px = ox + dx * d;
      py = oy + dy * d;
      const mx = px - this.offsetX;
      const my = py - this.offsetY;
      if (mx < 0 || mx >= MAZE_PIXEL_SIZE || my < 0 || my >= MAZE_PIXEL_SIZE) {
        if (prevGx >= 0 && prevGy >= 0) {
          return { hitX: px, hitY: py, wallMaterial: 'stone', cellX: prevGx, cellY: prevGy };
        }
        return null;
      }
      const gx = Math.floor(mx / CELL_SIZE);
      const gy = Math.floor(my / CELL_SIZE);
      if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) continue;
      if (gx === prevGx && gy === prevGy) continue;
      if (prevGx >= 0 && prevGy >= 0) {
        const fdx = gx - prevGx;
        const fdy = gy - prevGy;
        let wallHit = false;
        const prevCell = this.grid[prevGy][prevGx];
        if (fdx === 1 && prevCell.walls.right) wallHit = true;
        if (fdx === -1 && prevCell.walls.left) wallHit = true;
        if (fdy === 1 && prevCell.walls.bottom) wallHit = true;
        if (fdy === -1 && prevCell.walls.top) wallHit = true;
        if (wallHit) {
          return { hitX: px, hitY: py, wallMaterial: prevCell.wallMaterial, cellX: prevGx, cellY: prevGy };
        }
      }
      prevGx = gx;
      prevGy = gy;
    }
    return null;
  }

  addReflection(hitX: number, hitY: number, angle: number, wallMaterial: WallMaterial): void {
    let reflectAngle: number;
    const mx = hitX - this.offsetX;
    const my = hitY - this.offsetY;
    const cx = Math.floor(mx / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    const cy = Math.floor(my / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    const relX = mx - cx;
    const relY = my - cy;
    if (Math.abs(relX) > Math.abs(relY)) {
      reflectAngle = Math.PI - angle;
    } else {
      reflectAngle = -angle;
    }
    this.reflections.push({
      wallPixelX: hitX,
      wallPixelY: hitY,
      direction: reflectAngle,
      wallMaterial,
      age: 0,
      maxAge: 1.5
    });
  }

  addChestReveal(gx: number, gy: number): void {
    const exists = this.chestReveals.some(r => r.gridX === gx && r.gridY === gy);
    if (!exists) {
      this.chestReveals.push({ gridX: gx, gridY: gy, age: 0, maxAge: 3 });
    }
  }

  update(dt: number): void {
    this.updatePlayerMove(dt);
    if (this.damageFlash > 0) {
      this.damageFlash = Math.max(0, this.damageFlash - dt);
    }
    for (let i = this.reflections.length - 1; i >= 0; i--) {
      this.reflections[i].age += dt;
      if (this.reflections[i].age >= this.reflections[i].maxAge) {
        this.reflections.splice(i, 1);
      }
    }
    for (let i = this.chestReveals.length - 1; i >= 0; i--) {
      this.chestReveals[i].age += dt;
      if (this.chestReveals[i].age >= this.chestReveals[i].maxAge) {
        this.chestReveals.splice(i, 1);
      }
    }
  }
}
