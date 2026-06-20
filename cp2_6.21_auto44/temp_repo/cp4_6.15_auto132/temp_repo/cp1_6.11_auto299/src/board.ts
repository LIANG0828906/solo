export enum Stone {
  Empty = 0,
  Black = 1,
  White = 2
}

export interface MoveRecord {
  position: [number, number];
  stone: Stone;
  captured: [number, number][];
  previousKo: [number, number] | null;
}

export interface LadderPath {
  points: [number, number][];
  isComplete: boolean;
}

const BOARD_SIZE = 19;
const DIRECTIONS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

export class Board {
  private grid: Stone[][];
  private currentPlayer: Stone;
  private moveCount: number;
  private captures: { black: number; white: number };
  private lastMove: [number, number] | null;
  private koPoint: [number, number] | null;
  private history: MoveRecord[];

  constructor() {
    this.grid = this.createEmptyGrid();
    this.currentPlayer = Stone.Black;
    this.moveCount = 0;
    this.captures = { black: 0, white: 0 };
    this.lastMove = null;
    this.koPoint = null;
    this.history = [];
  }

  private createEmptyGrid(): Stone[][] {
    const grid: Stone[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      grid[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        grid[i][j] = Stone.Empty;
      }
    }
    return grid;
  }

  getGrid(): Stone[][] {
    return this.grid.map(row => [...row]);
  }

  getCurrentPlayer(): Stone {
    return this.currentPlayer;
  }

  getMoveCount(): number {
    return this.moveCount;
  }

  getCaptures(): { black: number; white: number } {
    return { ...this.captures };
  }

  getLastMove(): [number, number] | null {
    return this.lastMove;
  }

  getKoPoint(): [number, number] | null {
    return this.koPoint;
  }

  getHistory(): MoveRecord[] {
    return [...this.history];
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }

  private getGroup(x: number, y: number): [number, number][] {
    if (!this.isInBounds(x, y) || this.grid[x][y] === Stone.Empty) {
      return [];
    }
    const stone = this.grid[x][y];
    const group: [number, number][] = [];
    const visited = new Set<string>();
    const stack: [number, number][] = [[x, y]];

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      group.push([cx, cy]);

      for (const [dx, dy] of DIRECTIONS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.isInBounds(nx, ny) && this.grid[nx][ny] === stone) {
          stack.push([nx, ny]);
        }
      }
    }
    return group;
  }

  private countLiberties(group: [number, number][]): number {
    const liberties = new Set<string>();
    for (const [x, y] of group) {
      for (const [dx, dy] of DIRECTIONS) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny) && this.grid[nx][ny] === Stone.Empty) {
          liberties.add(`${nx},${ny}`);
        }
      }
    }
    return liberties.size;
  }

  private getLibertyPoints(group: [number, number][]): [number, number][] {
    const liberties = new Map<string, [number, number]>();
    for (const [x, y] of group) {
      for (const [dx, dy] of DIRECTIONS) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny) && this.grid[nx][ny] === Stone.Empty) {
          const key = `${nx},${ny}`;
          if (!liberties.has(key)) {
            liberties.set(key, [nx, ny]);
          }
        }
      }
    }
    return Array.from(liberties.values());
  }

  private removeGroup(group: [number, number][]): void {
    for (const [x, y] of group) {
      this.grid[x][y] = Stone.Empty;
    }
  }

  private isKoPoint(x: number, y: number): boolean {
    if (!this.koPoint) return false;
    return this.koPoint[0] === x && this.koPoint[1] === y;
  }

  canPlace(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    if (this.grid[x][y] !== Stone.Empty) return false;
    if (this.isKoPoint(x, y)) return false;

    const opponent = this.currentPlayer === Stone.Black ? Stone.White : Stone.Black;
    let capturesOpponent = false;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny) && this.grid[nx][ny] === opponent) {
        const group = this.getGroup(nx, ny);
        if (this.countLiberties(group) === 1) {
          capturesOpponent = true;
          break;
        }
      }
    }

    if (capturesOpponent) return true;

    const tempStone = this.grid[x][y];
    this.grid[x][y] = this.currentPlayer;
    const ownGroup = this.getGroup(x, y);
    const ownLiberties = this.countLiberties(ownGroup);
    this.grid[x][y] = tempStone;

    return ownLiberties > 0;
  }

  placeStone(x: number, y: number): boolean {
    if (!this.canPlace(x, y)) return false;

    const previousKo = this.koPoint;
    const captured: [number, number][] = [];
    const opponent = this.currentPlayer === Stone.Black ? Stone.White : Stone.Black;

    this.grid[x][y] = this.currentPlayer;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny) && this.grid[nx][ny] === opponent) {
        const group = this.getGroup(nx, ny);
        if (this.countLiberties(group) === 0) {
          for (const pos of group) {
            captured.push(pos);
          }
          this.removeGroup(group);
        }
      }
    }

    if (captured.length > 0) {
      if (this.currentPlayer === Stone.Black) {
        this.captures.black += captured.length;
      } else {
        this.captures.white += captured.length;
      }
    }

    let newKo: [number, number] | null = null;
    if (captured.length === 1) {
      const ownGroup = this.getGroup(x, y);
      if (ownGroup.length === 1 && this.countLiberties(ownGroup) === 1) {
        newKo = captured[0];
      }
    }
    this.koPoint = newKo;

    const record: MoveRecord = {
      position: [x, y],
      stone: this.currentPlayer,
      captured,
      previousKo
    };
    this.history.push(record);

    this.lastMove = [x, y];
    this.moveCount++;
    this.currentPlayer = opponent;

    return true;
  }

  undo(): boolean {
    if (this.history.length === 0) return false;

    const lastRecord = this.history.pop()!;
    const [x, y] = lastRecord.position;

    this.grid[x][y] = Stone.Empty;

    for (const [cx, cy] of lastRecord.captured) {
      this.grid[cx][cy] = lastRecord.stone === Stone.Black ? Stone.White : Stone.Black;
    }

    if (lastRecord.stone === Stone.Black) {
      this.captures.black -= lastRecord.captured.length;
    } else {
      this.captures.white -= lastRecord.captured.length;
    }

    this.koPoint = lastRecord.previousKo;
    this.currentPlayer = lastRecord.stone;
    this.moveCount--;

    if (this.history.length > 0) {
      this.lastMove = this.history[this.history.length - 1].position;
    } else {
      this.lastMove = null;
    }

    return true;
  }

  detectLadder(): LadderPath | null {
    if (this.history.length < 2) return null;

    const lastMove = this.history[this.history.length - 1];
    const [lx, ly] = lastMove.position;
    const opponent = lastMove.stone === Stone.Black ? Stone.White : Stone.Black;

    let atariGroup: [number, number][] | null = null;
    for (const [dx, dy] of DIRECTIONS) {
      const nx = lx + dx;
      const ny = ly + dy;
      if (this.isInBounds(nx, ny) && this.grid[nx][ny] === opponent) {
        const group = this.getGroup(nx, ny);
        if (this.countLiberties(group) === 1) {
          atariGroup = group;
          break;
        }
      }
    }

    if (!atariGroup || atariGroup.length !== 1) return null;

    const path: [number, number][] = [[lx, ly]];
    const visitedStates = new Set<string>();
    
    const result = this.simulateLadder(
      atariGroup[0][0],
      atariGroup[0][1],
      lastMove.stone,
      path,
      visitedStates,
      0
    );

    if (result && result.points.length >= 2) {
      return result;
    }
    return null;
  }

  private simulateLadder(
    targetX: number,
    targetY: number,
    attacker: Stone,
    currentPath: [number, number][],
    visited: Set<string>,
    depth: number
  ): LadderPath | null {
    if (depth > 100) return null;

    const defender = attacker === Stone.Black ? Stone.White : Stone.Black;

    const targetGroup = this.getGroup(targetX, targetY);
    const targetLiberties = this.getLibertyPoints(targetGroup);

    if (targetLiberties.length === 0) {
      return { points: [...currentPath], isComplete: true };
    }

    if (targetLiberties.length > 1) {
      return { points: [...currentPath], isComplete: false };
    }

    const escapePoint = targetLiberties[0];
    const stateKey = `${targetX},${targetY},${escapePoint[0]},${escapePoint[1]}`;
    if (visited.has(stateKey)) {
      return { points: [...currentPath], isComplete: false };
    }
    visited.add(stateKey);

    if (!this.canPlaceAt(escapePoint[0], escapePoint[1], defender)) {
      return { points: [...currentPath], isComplete: false };
    }

    this.grid[escapePoint[0]][escapePoint[1]] = defender;

    let bestLadder: LadderPath | null = null;

    for (const [dx, dy] of DIRECTIONS) {
      const ax = escapePoint[0] + dx;
      const ay = escapePoint[1] + dy;
      
      if (!this.isInBounds(ax, ay)) continue;
      if (this.grid[ax][ay] !== Stone.Empty) continue;
      if (!this.canPlaceAt(ax, ay, attacker)) continue;

      this.grid[ax][ay] = attacker;

      let capturedGroup: [number, number][] | null = null;
      for (const [edx, edy] of DIRECTIONS) {
        const cx = ax + edx;
        const cy = ay + edy;
        if (this.isInBounds(cx, cy) && this.grid[cx][cy] === defender) {
          const group = this.getGroup(cx, cy);
          if (this.countLiberties(group) === 0) {
            capturedGroup = group;
            break;
          }
        }
      }

      if (capturedGroup) {
        this.removeGroup(capturedGroup);
        currentPath.push([ax, ay]);
        const result = this.simulateLadder(
          escapePoint[0],
          escapePoint[1],
          attacker,
          currentPath,
          visited,
          depth + 1
        );
        currentPath.pop();

        for (const [cx, cy] of capturedGroup) {
          this.grid[cx][cy] = defender;
        }
      } else {
        const newTargetGroup = this.getGroup(escapePoint[0], escapePoint[1]);
        if (this.countLiberties(newTargetGroup) === 1) {
          currentPath.push([ax, ay]);
          const result = this.simulateLadder(
            escapePoint[0],
            escapePoint[1],
            attacker,
            currentPath,
            visited,
            depth + 1
          );
          currentPath.pop();

          if (result) {
            if (!bestLadder || result.points.length > bestLadder.points.length) {
              bestLadder = result;
            }
          }
        }
      }

      this.grid[ax][ay] = Stone.Empty;
    }

    this.grid[escapePoint[0]][escapePoint[1]] = Stone.Empty;

    return bestLadder;
  }

  private canPlaceAt(x: number, y: number, stone: Stone): boolean {
    if (!this.isInBounds(x, y)) return false;
    if (this.grid[x][y] !== Stone.Empty) return false;

    const opponent = stone === Stone.Black ? Stone.White : Stone.Black;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny) && this.grid[nx][ny] === opponent) {
        const group = this.getGroup(nx, ny);
        if (this.countLiberties(group) === 1) {
          return true;
        }
      }
    }

    const temp = this.grid[x][y];
    this.grid[x][y] = stone;
    const ownGroup = this.getGroup(x, y);
    const liberties = this.countLiberties(ownGroup);
    this.grid[x][y] = temp;

    return liberties > 0;
  }

  getBoardSize(): number {
    return BOARD_SIZE;
  }
}
