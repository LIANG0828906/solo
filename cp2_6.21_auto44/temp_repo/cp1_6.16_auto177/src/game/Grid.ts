export interface Position {
  x: number;
  y: number;
}

export enum CellState {
  Empty = 0,
  Occupied = 1,
  Blocked = 2,
}

export class Grid {
  readonly cols: number = 12;
  readonly rows: number = 8;
  readonly cellSize: number = 50;
  private cells: CellState[][];
  private characterMap: Map<string, Position>;

  constructor() {
    this.cells = [];
    this.characterMap = new Map();
    for (let y = 0; y < this.rows; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.cells[y][x] = CellState.Empty;
      }
    }
  }

  isValidCoord(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  getCellState(x: number, y: number): CellState {
    if (!this.isValidCoord(x, y)) return CellState.Blocked;
    return this.cells[y][x];
  }

  setCellState(x: number, y: number, state: CellState): void {
    if (!this.isValidCoord(x, y)) return;
    this.cells[y][x] = state;
  }

  placeCharacter(characterId: string, x: number, y: number): boolean {
    if (!this.isValidCoord(x, y)) return false;
    if (this.cells[y][x] !== CellState.Empty) return false;
    this.cells[y][x] = CellState.Occupied;
    this.characterMap.set(characterId, { x, y });
    return true;
  }

  removeCharacter(characterId: string): void {
    const pos = this.characterMap.get(characterId);
    if (pos) {
      this.cells[pos.y][pos.x] = CellState.Empty;
      this.characterMap.delete(characterId);
    }
  }

  moveCharacter(characterId: string, newX: number, newY: number): boolean {
    if (!this.isValidCoord(newX, newY)) return false;
    if (this.cells[newY][newX] !== CellState.Empty) return false;
    const oldPos = this.characterMap.get(characterId);
    if (!oldPos) return false;
    this.cells[oldPos.y][oldPos.x] = CellState.Empty;
    this.cells[newY][newX] = CellState.Occupied;
    this.characterMap.set(characterId, { x: newX, y: newY });
    return true;
  }

  getCharacterPosition(characterId: string): Position | undefined {
    return this.characterMap.get(characterId);
  }

  getCharacterAt(x: number, y: number): string | undefined {
    for (const [id, pos] of this.characterMap) {
      if (pos.x === x && pos.y === y) return id;
    }
    return undefined;
  }

  getMovementRange(characterId: string, moveRange: number): Position[] {
    const pos = this.characterMap.get(characterId);
    if (!pos) return [];
    return this.bfsRange(pos, moveRange);
  }

  getAttackRange(characterId: string, attackRange: number): Position[] {
    const pos = this.characterMap.get(characterId);
    if (!pos) return [];
    const result: Position[] = [];
    for (let dy = -attackRange; dy <= attackRange; dy++) {
      for (let dx = -attackRange; dx <= attackRange; dx++) {
        if (dx === 0 && dy === 0) continue;
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist <= attackRange) {
          const nx = pos.x + dx;
          const ny = pos.y + dy;
          if (this.isValidCoord(nx, ny)) {
            result.push({ x: nx, y: ny });
          }
        }
      }
    }
    return result;
  }

  findShortestPath(from: Position, to: Position): Position[] {
    if (from.x === to.x && from.y === to.y) return [];
    const visited = new Set<string>();
    const queue: { pos: Position; path: Position[] }[] = [{ pos: from, path: [] }];
    visited.add(`${from.x},${from.y}`);
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dir of dirs) {
        const nx = current.pos.x + dir.x;
        const ny = current.pos.y + dir.y;
        const key = `${nx},${ny}`;
        if (!this.isValidCoord(nx, ny) || visited.has(key)) continue;
        if (this.cells[ny][nx] === CellState.Blocked) continue;
        if (nx === to.x && ny === to.y) {
          return [...current.path, { x: nx, y: ny }];
        }
        if (this.cells[ny][nx] === CellState.Empty) {
          visited.add(key);
          queue.push({
            pos: { x: nx, y: ny },
            path: [...current.path, { x: nx, y: ny }],
          });
        }
      }
    }
    return [];
  }

  private bfsRange(start: Position, range: number): Position[] {
    const result: Position[] = [];
    const visited = new Set<string>();
    const queue: { pos: Position; cost: number }[] = [{ pos: start, cost: 0 }];
    visited.add(`${start.x},${start.y}`);
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.cost > 0) {
        result.push(current.pos);
      }
      if (current.cost >= range) continue;
      const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];
      for (const dir of dirs) {
        const nx = current.pos.x + dir.x;
        const ny = current.pos.y + dir.y;
        const key = `${nx},${ny}`;
        if (!this.isValidCoord(nx, ny) || visited.has(key)) continue;
        if (this.cells[ny][nx] !== CellState.Empty) continue;
        visited.add(key);
        queue.push({ pos: { x: nx, y: ny }, cost: current.cost + 1 });
      }
    }
    return result;
  }

  reset(): void {
    this.characterMap.clear();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.cells[y][x] = CellState.Empty;
      }
    }
  }

  getAllCharacterPositions(): Map<string, Position> {
    return new Map(this.characterMap);
  }
}
