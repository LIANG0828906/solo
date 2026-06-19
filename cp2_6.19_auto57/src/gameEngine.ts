export enum GemColor {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
  Yellow = 'yellow',
  Purple = 'purple',
  Orange = 'orange',
  Pink = 'pink'
}

export const GEM_COLOR_VALUES: Record<GemColor, number> = {
  [GemColor.Red]: 0xff4757,
  [GemColor.Green]: 0x2ed573,
  [GemColor.Blue]: 0x1e90ff,
  [GemColor.Yellow]: 0xffd700,
  [GemColor.Purple]: 0xa55eea,
  [GemColor.Orange]: 0xff7f50,
  [GemColor.Pink]: 0xff6b9d
};

export interface Gem {
  id: string;
  color: GemColor;
  isEliminating: boolean;
  isFalling: boolean;
  fallTargetRow: number;
  fallStartY: number;
}

export interface Cell {
  row: number;
  col: number;
  height: number;
  isWall: boolean;
  gem: Gem | null;
}

export interface GemPosition {
  row: number;
  col: number;
  color: GemColor;
  gemId: string;
  worldX: number;
  worldY: number;
  worldZ: number;
}

export interface FallingGemInfo {
  targetRow: number;
  targetCol: number;
  sourceRow: number;
  sourceCol: number;
  gem: Gem;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface LevelUpData {
  level: number;
  gridSize: number;
  wallRatio: number;
}

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}

export const eventBus = new EventBus();

export class GameEngine {
  private gridSize: number = 6;
  private cells: Cell[][] = [];
  private score: number = 0;
  private highScore: number = 0;
  private level: number = 1;
  private wallRatio: number = 0.1;
  private isAnimating: boolean = false;
  private isLevelTransitioning: boolean = false;
  private gemColors: GemColor[] = [];
  private cellSize: number = 1;
  private scoreThresholds: number[] = [30, 60, 100];
  private gridSizes: number[] = [6, 7, 8, 9];
  private gemIdCounter: number = 0;
  private chainCount: number = 0;
  private readonly GEM_FLOAT_HEIGHT: number = 0.3;
  private readonly CELL_MIN_HEIGHT: number = 0.2;
  private readonly CELL_MAX_HEIGHT: number = 2.0;

  constructor() {
    this.loadHighScore();
    this.initLevel();
  }

  private loadHighScore(): void {
    const saved = localStorage.getItem('gemMazeHighScore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  private saveHighScore(): void {
    localStorage.setItem('gemMazeHighScore', this.highScore.toString());
  }

  private initLevel(): void {
    this.gemColors = this.getGemColorsForLevel();
    this.wallRatio = this.getWallRatioForLevel();
    this.gridSize = this.getGridSizeForLevel();
    this.generateMaze();
    this.ensureInitialMatch();
  }

  private getGemColorsForLevel(): GemColor[] {
    const baseColors: GemColor[] = [
      GemColor.Red,
      GemColor.Green,
      GemColor.Blue,
      GemColor.Yellow,
      GemColor.Purple,
      GemColor.Orange
    ];
    if (this.level >= 2) {
      baseColors.push(GemColor.Pink);
    }
    return baseColors;
  }

  private getWallRatioForLevel(): number {
    return this.level >= 2 ? 0.15 : 0.1;
  }

  private getGridSizeForLevel(): number {
    const idx = Math.min(this.level - 1, this.gridSizes.length - 1);
    return this.gridSizes[idx];
  }

  private generateMaze(): void {
    this.cells = [];
    const heightRange = this.CELL_MAX_HEIGHT - this.CELL_MIN_HEIGHT;
    for (let row = 0; row < this.gridSize; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        const isWall = Math.random() < this.wallRatio;
        const height = isWall ? 0 : this.CELL_MIN_HEIGHT + Math.random() * heightRange;
        const cell: Cell = {
          row,
          col,
          height,
          isWall,
          gem: null
        };
        if (!isWall) {
          cell.gem = this.createRandomGem();
        }
        this.cells[row][col] = cell;
      }
    }
  }

  private createRandomGem(): Gem {
    this.gemIdCounter++;
    return {
      id: `gem_${this.gemIdCounter}`,
      color: this.getRandomGemColor(),
      isEliminating: false,
      isFalling: false,
      fallTargetRow: -1,
      fallStartY: 0
    };
  }

  private getRandomGemColor(): GemColor {
    const index = Math.floor(Math.random() * this.gemColors.length);
    return this.gemColors[index];
  }

  private ensureInitialMatch(): void {
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.hasEnoughInitialMatches()) {
        return;
      }
      this.reshuffleGems();
    }
    this.forceCreateMultipleMatches();
  }

  private hasEnoughInitialMatches(): boolean {
    const matches: { positions: { row: number; col: number }[]; center: { row: number; col: number } }[] = [];
    const visited = new Set<string>();

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const key = `${row},${col}`;
        if (visited.has(key)) continue;
        const cell = this.cells[row][col];
        if (cell.isWall || !cell.gem) continue;

        const connected = this.getConnectedGems(row, col);
        connected.forEach((p) => visited.add(`${p.row},${p.col}`));

        if (connected.length >= 3) {
          const centerRow = connected.reduce((s, p) => s + p.row, 0) / connected.length;
          const centerCol = connected.reduce((s, p) => s + p.col, 0) / connected.length;
          matches.push({
            positions: connected,
            center: { row: centerRow, col: centerCol }
          });
        }
      }
    }

    if (matches.length < 2) return false;

    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const dist = Math.sqrt(
          Math.pow(matches[i].center.row - matches[j].center.row, 2) +
          Math.pow(matches[i].center.col - matches[j].center.col, 2)
        );
        if (dist >= this.gridSize / 3) {
          return true;
        }
      }
    }

    return false;
  }

  private reshuffleGems(): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.cells[row][col];
        if (!cell.isWall && cell.gem) {
          cell.gem.color = this.getRandomGemColor();
        }
      }
    }
  }

  private forceCreateMultipleMatches(): void {
    const nonWallCells: { row: number; col: number }[] = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.cells[row][col].isWall) {
          nonWallCells.push({ row, col });
        }
      }
    }

    const triplets: { row: number; col: number }[][] = [];
    for (let i = 0; i < nonWallCells.length - 2; i++) {
      const c1 = nonWallCells[i];
      const c2 = nonWallCells[i + 1];
      const c3 = nonWallCells[i + 2];

      const areAdjacent =
        (Math.abs(c1.row - c2.row) + Math.abs(c1.col - c2.col) === 1) &&
        (Math.abs(c2.row - c3.row) + Math.abs(c2.col - c3.col) === 1);

      if (areAdjacent) {
        triplets.push([c1, c2, c3]);
      }
    }

    const shuffled = triplets.sort(() => Math.random() - 0.5);
    const usedColors = new Set<GemColor>();
    const placed: { center: { row: number; col: number }; positions: { row: number; col: number }[] }[] = [];

    for (const triplet of shuffled) {
      if (placed.length >= 2) break;

      const centerRow = triplet.reduce((s, p) => s + p.row, 0) / triplet.length;
      const centerCol = triplet.reduce((s, p) => s + p.col, 0) / triplet.length;

      let farEnough = true;
      for (const p of placed) {
        const dist = Math.sqrt(
          Math.pow(centerRow - p.center.row, 2) +
          Math.pow(centerCol - p.center.col, 2)
        );
        if (dist < this.gridSize / 3) {
          farEnough = false;
          break;
        }
      }
      if (!farEnough) continue;

      let color: GemColor | null = null;
      for (const c of this.gemColors) {
        if (!usedColors.has(c)) {
          color = c;
          break;
        }
      }
      if (!color) color = this.getRandomGemColor();
      usedColors.add(color);

      triplet.forEach((p) => {
        this.cells[p.row][p.col].gem!.color = color!;
      });

      placed.push({
        center: { row: centerRow, col: centerCol },
        positions: triplet
      });
    }

    if (placed.length < 2 && shuffled.length >= 2) {
      const lastTriplet = shuffled[shuffled.length - 1];
      let color: GemColor | null = null;
      for (const c of this.gemColors) {
        if (!usedColors.has(c)) {
          color = c;
          break;
        }
      }
      if (!color) color = this.getRandomGemColor();
      lastTriplet.forEach((p) => {
        this.cells[p.row][p.col].gem!.color = color!;
      });
    }
  }

  private getConnectedGems(row: number, col: number): { row: number; col: number }[] {
    const cell = this.cells[row][col];
    if (!cell.gem || cell.isWall) return [];

    const targetColor = cell.gem.color;
    const visited = new Set<string>();
    const result: { row: number; col: number }[] = [];
    const queue: { row: number; col: number }[] = [{ row, col }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const currentCell = this.cells[current.row]?.[current.col];
      if (!currentCell || currentCell.isWall || !currentCell.gem) continue;
      if (currentCell.gem.color !== targetColor) continue;

      result.push(current);

      const directions = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 }
      ];

      for (const dir of directions) {
        const newRow = current.row + dir.dr;
        const newCol = current.col + dir.dc;
        if (
          newRow >= 0 &&
          newRow < this.gridSize &&
          newCol >= 0 &&
          newCol < this.gridSize
        ) {
          queue.push({ row: newRow, col: newCol });
        }
      }
    }

    return result;
  }

  public handleGemClick(row: number, col: number): void {
    if (this.isAnimating) return;

    const cell = this.cells[row]?.[col];
    if (!cell || cell.isWall || !cell.gem) return;

    const connected = this.getConnectedGems(row, col);
    if (connected.length < 3) {
      eventBus.emit('gem-invalid-click', { row, col });
      return;
    }

    this.isAnimating = true;
    this.chainCount = 0;
    this.eliminateGems(connected);
  }

  private eliminateGems(gemPositions: { row: number; col: number }[]): void {
    this.chainCount++;

    const worldPositions: GemPosition[] = gemPositions.map((pos) => {
      const cell = this.cells[pos.row][pos.col];
      const world = this.gridToWorld(pos.row, pos.col);
      return {
        row: pos.row,
        col: pos.col,
        color: cell.gem!.color,
        gemId: cell.gem!.id,
        worldX: world.x,
        worldY: world.y + cell.height + this.GEM_FLOAT_HEIGHT,
        worldZ: world.z
      };
    });

    gemPositions.forEach((pos) => {
      const cell = this.cells[pos.row][pos.col];
      if (cell.gem) {
        cell.gem.isEliminating = true;
      }
    });

    const baseScore = gemPositions.length * 10;
    const chainBonus = this.chainCount > 1 ? 20 * (this.chainCount - 1) : 0;
    const totalScore = baseScore + chainBonus;
    this.addScore(totalScore);

    eventBus.emit('gems-eliminated', { gems: worldPositions });

    setTimeout(() => {
      gemPositions.forEach((pos) => {
        const cell = this.cells[pos.row][pos.col];
        cell.gem = null;
      });

      this.applyGravity();
    }, 600);
  }

  private addScore(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    eventBus.emit('score-updated', {
      score: this.score,
      highScore: this.highScore
    });

    const progress = this.getLevelProgress();
    eventBus.emit('progress-updated', { progress, level: this.level });

    const nextLevel = this.computeTargetLevel(this.score);
    if (nextLevel > this.level && !this.isLevelTransitioning) {
      this.levelUp(nextLevel);
    }
  }

  private computeTargetLevel(score: number): number {
    let level = 1;
    for (let i = 0; i < this.scoreThresholds.length; i++) {
      if (score >= this.scoreThresholds[i]) {
        level = i + 2;
      } else {
        break;
      }
    }
    return Math.min(level, this.gridSizes.length);
  }

  private getCurrentThreshold(): number {
    if (this.level >= this.scoreThresholds.length + 1) {
      return this.scoreThresholds[this.scoreThresholds.length - 1];
    }
    return this.scoreThresholds[this.level - 1];
  }

  private getPreviousThreshold(): number {
    if (this.level <= 1) return 0;
    return this.scoreThresholds[this.level - 2];
  }

  private getLevelProgress(): number {
    if (this.level >= this.gridSizes.length) return 1;
    const prev = this.getPreviousThreshold();
    const curr = this.getCurrentThreshold();
    const range = curr - prev;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, (this.score - prev) / range));
  }

  private levelUp(targetLevel: number): void {
    this.isLevelTransitioning = true;
    this.level = targetLevel;

    const levelData: LevelUpData = {
      level: this.level,
      gridSize: this.getGridSizeForLevel(),
      wallRatio: this.getWallRatioForLevel()
    };

    eventBus.emit('level-up', levelData);

    setTimeout(() => {
      this.initLevel();
      eventBus.emit('grid-updated', {
        cells: this.cells,
        gridSize: this.gridSize,
        cellSize: this.cellSize
      });
      this.isAnimating = false;
      this.isLevelTransitioning = false;

      eventBus.emit('progress-updated', {
        progress: this.getLevelProgress(),
        level: this.level
      });
    }, 2000);
  }

  private applyGravity(): void {
    const fallingGems: FallingGemInfo[] = [];

    for (let col = 0; col < this.gridSize; col++) {
      let writeRow = this.gridSize - 1;

      for (let row = this.gridSize - 1; row >= 0; row--) {
        const cell = this.cells[row][col];
        if (cell.isWall) {
          writeRow = row - 1;
          continue;
        }

        if (cell.gem) {
          if (row !== writeRow) {
            const targetCell = this.cells[writeRow][col];
            const gem = cell.gem;
            gem.isFalling = true;
            gem.fallTargetRow = writeRow;

            const sourceWorld = this.gridToWorld(row, col);
            const targetWorld = this.gridToWorld(writeRow, col);
            const startY = sourceWorld.y + this.GEM_FLOAT_HEIGHT;
            const targetY = targetWorld.y + this.GEM_FLOAT_HEIGHT;

            fallingGems.push({
              targetRow: writeRow,
              targetCol: col,
              sourceRow: row,
              sourceCol: col,
              gem,
              startX: sourceWorld.x,
              startY,
              startZ: sourceWorld.z,
              targetX: targetWorld.x,
              targetY,
              targetZ: targetWorld.z
            });

            targetCell.gem = gem;
            cell.gem = null;
          }
          writeRow--;
        }
      }

      let spawnIndex = 0;
      while (writeRow >= 0) {
        const cell = this.cells[writeRow][col];
        if (!cell.isWall) {
          const newGem = this.createGemWithoutFourMatch(col, writeRow);

          const targetWorld = this.gridToWorld(writeRow, col);
          const spawnOffset = (spawnIndex + 1) * 1.5;
          const startY = targetWorld.y + this.GEM_FLOAT_HEIGHT + spawnOffset;

          newGem.isFalling = true;
          newGem.fallTargetRow = writeRow;

          cell.gem = newGem;

          fallingGems.push({
            targetRow: writeRow,
            targetCol: col,
            sourceRow: -1 - spawnIndex,
            sourceCol: col,
            gem: newGem,
            startX: targetWorld.x,
            startY,
            startZ: targetWorld.z,
            targetX: targetWorld.x,
            targetY: targetWorld.y + this.GEM_FLOAT_HEIGHT,
            targetZ: targetWorld.z
          });

          spawnIndex++;
        }
        writeRow--;
      }
    }

    if (fallingGems.length > 0) {
      eventBus.emit('gems-falling', { gems: fallingGems });

      const maxFallDistance = fallingGems.reduce((max, g) => {
        const dist = Math.abs(g.targetY - g.startY);
        return Math.max(max, dist);
      }, 0);

      const fallDuration = (maxFallDistance / 0.5) * (1000 / 60);

      setTimeout(() => {
        fallingGems.forEach((info) => {
          info.gem.isFalling = false;
        });

        this.checkChainReaction();
      }, fallDuration + 100);
    } else {
      this.isAnimating = false;
    }
  }

  private createGemWithoutFourMatch(col: number, targetRow: number): Gem {
    const gem = this.createRandomGem();

    let maxAttempts = 20;
    while (maxAttempts > 0) {
      if (!this.wouldCreateFourMatch(gem.color, targetRow, col)) {
        break;
      }
      gem.color = this.getRandomGemColor();
      maxAttempts--;
    }

    return gem;
  }

  private wouldCreateFourMatch(color: GemColor, row: number, col: number): boolean {
    let verticalCount = 1;
    for (let r = row + 1; r < this.gridSize; r++) {
      const cell = this.cells[r][col];
      if (cell.isWall || !cell.gem || cell.gem.color !== color) break;
      verticalCount++;
    }
    if (verticalCount >= 4) return true;

    return false;
  }

  private checkChainReaction(): void {
    let bestMatch: { row: number; col: number; count: number } | null = null;

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.cells[row][col];
        if (cell.isWall || !cell.gem) continue;
        const connected = this.getConnectedGems(row, col);
        if (connected.length >= 3) {
          if (!bestMatch || connected.length > bestMatch.count) {
            bestMatch = { row, col, count: connected.length };
          }
        }
      }
    }

    if (bestMatch) {
      const connected = this.getConnectedGems(bestMatch.row, bestMatch.col);
      this.eliminateGems(connected);
    } else {
      this.isAnimating = false;
    }
  }

  public gridToWorld(row: number, col: number): { x: number; y: number; z: number } {
    const offset = ((this.gridSize - 1) * this.cellSize) / 2;
    const x = col * this.cellSize - offset;
    const z = row * this.cellSize - offset;
    const y = this.cells[row]?.[col]?.height ?? 0;
    return { x, y, z };
  }

  public worldToGrid(x: number, z: number): { row: number; col: number } | null {
    const offset = ((this.gridSize - 1) * this.cellSize) / 2;
    const col = Math.round((x + offset) / this.cellSize);
    const row = Math.round((z + offset) / this.cellSize);
    if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
      return null;
    }
    return { row, col };
  }

  public resetGame(): void {
    this.score = 0;
    this.level = 1;
    this.chainCount = 0;
    this.isAnimating = false;
    this.isLevelTransitioning = false;
    this.gemIdCounter = 0;
    this.initLevel();

    eventBus.emit('score-updated', {
      score: this.score,
      highScore: this.highScore
    });
    eventBus.emit('progress-updated', {
      progress: 0,
      level: this.level
    });
    eventBus.emit('grid-updated', {
      cells: this.cells,
      gridSize: this.gridSize,
      cellSize: this.cellSize
    });
  }

  public getCells(): Cell[][] {
    return this.cells;
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getCellSize(): number {
    return this.cellSize;
  }

  public getScore(): number {
    return this.score;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getLevel(): number {
    return this.level;
  }

  public getIsAnimating(): boolean {
    return this.isAnimating;
  }
}
