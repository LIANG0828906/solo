import { Position, Cell, GRID_SIZE } from '../types';

interface HitRecord {
  x: number;
  y: number;
  isHit: boolean;
}

export class AILogic {
  private hitStack: Position[] = [];
  private hitRecords: HitRecord[] = [];
  private firstHit: Position | null = null;
  private direction: 'horizontal' | 'vertical' | null = null;
  private directionConfirmed = false;

  reset() {
    this.hitStack = [];
    this.hitRecords = [];
    this.firstHit = null;
    this.direction = null;
    this.directionConfirmed = false;
  }

  getNextTarget(grid: Cell[][]): Position {
    if (this.hitStack.length > 0 || this.firstHit) {
      const target = this.findTargetMode(grid);
      if (target) return target;
    }

    return this.findHuntMode(grid);
  }

  recordHit(x: number, y: number, isHit: boolean) {
    this.hitRecords.push({ x, y, isHit });

    if (isHit) {
      if (!this.firstHit) {
        this.firstHit = { x, y };
      }

      if (!this.directionConfirmed && this.firstHit) {
        const dx = Math.abs(x - this.firstHit.x);
        const dy = Math.abs(y - this.firstHit.y);
        if (dx > 1 || dy > 1) {
          this.directionConfirmed = true;
          this.direction = dx > dy ? 'horizontal' : 'vertical';
        }
      }

      this.hitStack.push({ x, y });
    } else {
      if (this.firstHit && !this.directionConfirmed && this.hitStack.length <= 1) {
      }
    }
  }

  recordSunk() {
    this.hitStack = [];
    this.firstHit = null;
    this.direction = null;
    this.directionConfirmed = false;
  }

  private findTargetMode(grid: Cell[][]): Position | null {
    if (!this.firstHit) return null;

    const hitPositions = this.hitRecords.filter((r) => r.isHit).map((r) => ({ x: r.x, y: r.y }));

    if (hitPositions.length === 0) return null;

    if (this.directionConfirmed && this.direction) {
      const sorted = [...hitPositions].sort((a, b) =>
        this.direction === 'horizontal' ? a.x - b.x : a.y - b.y
      );

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      if (this.direction === 'horizontal') {
        const leftX = first.x - 1;
        if (leftX >= 0 && !grid[first.y][leftX].isHit && !grid[first.y][leftX].isMiss) {
          return { x: leftX, y: first.y };
        }
        const rightX = last.x + 1;
        if (rightX < GRID_SIZE && !grid[last.y][rightX].isHit && !grid[last.y][rightX].isMiss) {
          return { x: rightX, y: last.y };
        }
      } else {
        const topY = first.y - 1;
        if (topY >= 0 && !grid[topY][first.x].isHit && !grid[topY][first.x].isMiss) {
          return { x: first.x, y: topY };
        }
        const bottomY = last.y + 1;
        if (bottomY < GRID_SIZE && !grid[bottomY][last.x].isHit && !grid[bottomY][last.x].isMiss) {
          return { x: last.x, y: bottomY };
        }
      }

      this.recordSunk();
      return null;
    }

    const adjacent = this.getAdjacentCells(this.firstHit.x, this.firstHit.y);
    for (const pos of adjacent) {
      if (pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE) {
        if (!grid[pos.y][pos.x].isHit && !grid[pos.y][pos.x].isMiss) {
          return pos;
        }
      }
    }

    return null;
  }

  private getAdjacentCells(x: number, y: number): Position[] {
    return [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];
  }

  private findHuntMode(grid: Cell[][]): Position {
    const candidates: Position[] = [];
    const probabilityGrid: number[][] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      probabilityGrid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        probabilityGrid[y][x] = 0;
      }
    }

    const shipLengths = [5, 4, 3, 2, 1];

    for (const length of shipLengths) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x <= GRID_SIZE - length; x++) {
          let valid = true;
          for (let i = 0; i < length; i++) {
            if (grid[y][x + i].isHit || grid[y][x + i].isMiss) {
              valid = false;
              break;
            }
          }
          if (valid) {
            for (let i = 0; i < length; i++) {
              probabilityGrid[y][x + i]++;
            }
          }
        }
      }

      for (let y = 0; y <= GRID_SIZE - length; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          let valid = true;
          for (let i = 0; i < length; i++) {
            if (grid[y + i][x].isHit || grid[y + i][x].isMiss) {
              valid = false;
              break;
            }
          }
          if (valid) {
            for (let i = 0; i < length; i++) {
              probabilityGrid[y + i][x]++;
            }
          }
        }
      }
    }

    let maxProb = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!grid[y][x].isHit && !grid[y][x].isMiss) {
          if (probabilityGrid[y][x] > maxProb) {
            maxProb = probabilityGrid[y][x];
            candidates.length = 0;
            candidates.push({ x, y });
          } else if (probabilityGrid[y][x] === maxProb) {
            candidates.push({ x, y });
          }
        }
      }
    }

    if (candidates.length === 0) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (!grid[y][x].isHit && !grid[y][x].isMiss) {
            candidates.push({ x, y });
          }
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }
}

export const aiLogic = new AILogic();
