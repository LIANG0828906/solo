export type HexCoord = {
  q: number;
  r: number;
};

export type CellType = 'empty' | 'obstacle';

export type Team = 'player' | 'enemy';

export interface Unit {
  id: string;
  team: Team;
  q: number;
  r: number;
  hp: number;
  maxHp: number;
  attack: number;
  moveRange: number;
  attackRange: number;
  hasActed: boolean;
  hasMoved: boolean;
}

export interface Cell {
  q: number;
  r: number;
  type: CellType;
}

export class MapGrid {
  public readonly width: number;
  public readonly height: number;
  private cells: Map<string, Cell> = new Map();
  private units: Map<string, Unit> = new Map();

  constructor(width: number = 10, height: number = 10) {
    this.width = width;
    this.height = height;
    this.generateGrid();
    this.generateObstacles();
  }

  private generateGrid(): void {
    for (let r = 0; r < this.height; r++) {
      for (let q = 0; q < this.width; q++) {
        const key = this.getKey(q, r);
        this.cells.set(key, { q, r, type: 'empty' });
      }
    }
  }

  private generateObstacles(): void {
    const totalCells = this.width * this.height;
    const obstacleCount = Math.floor(totalCells * 0.1);
    let placed = 0;

    while (placed < obstacleCount) {
      const q = Math.floor(Math.random() * this.width);
      const r = Math.floor(Math.random() * this.height);
      const cell = this.getCell(q, r);
      if (cell && cell.type === 'empty') {
        cell.type = 'obstacle';
        placed++;
      }
    }
  }

  private getKey(q: number, r: number): string {
    return `${q},${r}`;
  }

  public getCell(q: number, r: number): Cell | undefined {
    return this.cells.get(this.getKey(q, r));
  }

  public isInBounds(q: number, r: number): boolean {
    return q >= 0 && q < this.width && r >= 0 && r < this.height;
  }

  public isPassable(q: number, r: number): boolean {
    const cell = this.getCell(q, r);
    if (!cell || cell.type === 'obstacle') return false;
    return this.getUnitAt(q, r) === undefined;
  }

  public isWalkable(q: number, r: number): boolean {
    const cell = this.getCell(q, r);
    return cell !== undefined && cell.type !== 'obstacle';
  }

  public getNeighbors(q: number, r: number): HexCoord[] {
    const evenRowOffsets = [
      { dq: 1, dr: 0 },
      { dq: 0, dr: -1 },
      { dq: -1, dr: -1 },
      { dq: -1, dr: 0 },
      { dq: -1, dr: 1 },
      { dq: 0, dr: 1 },
    ];
    const oddRowOffsets = [
      { dq: 1, dr: 0 },
      { dq: 1, dr: -1 },
      { dq: 0, dr: -1 },
      { dq: -1, dr: 0 },
      { dq: 0, dr: 1 },
      { dq: 1, dr: 1 },
    ];

    const offsets = r % 2 === 0 ? evenRowOffsets : oddRowOffsets;
    const neighbors: HexCoord[] = [];

    for (const offset of offsets) {
      const nq = q + offset.dq;
      const nr = r + offset.dr;
      if (this.isInBounds(nq, nr)) {
        neighbors.push({ q: nq, r: nr });
      }
    }

    return neighbors;
  }

  public getDistance(a: HexCoord, b: HexCoord): number {
    const ax = a.q - Math.floor(a.r / 2);
    const az = a.r;
    const ay = -ax - az;

    const bx = b.q - Math.floor(b.r / 2);
    const bz = b.r;
    const by = -bx - bz;

    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
  }

  public addUnit(unit: Unit): void {
    this.units.set(unit.id, unit);
  }

  public removeUnit(unitId: string): void {
    this.units.delete(unitId);
  }

  public getUnit(unitId: string): Unit | undefined {
    return this.units.get(unitId);
  }

  public getUnitAt(q: number, r: number): Unit | undefined {
    for (const unit of this.units.values()) {
      if (unit.q === q && unit.r === r) {
        return unit;
      }
    }
    return undefined;
  }

  public getUnitsByTeam(team: Team): Unit[] {
    const result: Unit[] = [];
    for (const unit of this.units.values()) {
      if (unit.team === team) {
        result.push(unit);
      }
    }
    return result;
  }

  public getAllUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  public getAllCells(): Cell[] {
    return Array.from(this.cells.values());
  }

  public resetUnitActions(): void {
    for (const unit of this.units.values()) {
      unit.hasActed = false;
      unit.hasMoved = false;
    }
  }

  public spawnUnits(playerCount: number = 5, enemyCount: number = 5): void {
    this.units.clear();
    let unitId = 0;

    const spawnPositions = (startCol: number, endCol: number): HexCoord[] => {
      const positions: HexCoord[] = [];
      for (let r = 0; r < this.height; r++) {
        for (let q = startCol; q <= endCol; q++) {
          const cell = this.getCell(q, r);
          if (cell && cell.type === 'empty') {
            positions.push({ q, r });
          }
        }
      }
      return positions;
    };

    const playerPositions = spawnPositions(0, 1);
    for (let i = 0; i < playerCount && i < playerPositions.length; i++) {
      const pos = playerPositions[Math.floor(Math.random() * playerPositions.length)];
      const idx = playerPositions.indexOf(pos);
      playerPositions.splice(idx, 1);
      this.addUnit({
        id: `player-${unitId++}`,
        team: 'player',
        q: pos.q,
        r: pos.r,
        hp: 100,
        maxHp: 100,
        attack: 25,
        moveRange: 3,
        attackRange: 2,
        hasActed: false,
        hasMoved: false,
      });
    }

    const enemyPositions = spawnPositions(this.width - 2, this.width - 1);
    for (let i = 0; i < enemyCount && i < enemyPositions.length; i++) {
      const pos = enemyPositions[Math.floor(Math.random() * enemyPositions.length)];
      const idx = enemyPositions.indexOf(pos);
      enemyPositions.splice(idx, 1);
      this.addUnit({
        id: `enemy-${unitId++}`,
        team: 'enemy',
        q: pos.q,
        r: pos.r,
        hp: 80,
        maxHp: 80,
        attack: 20,
        moveRange: 3,
        attackRange: 2,
        hasActed: false,
        hasMoved: false,
      });
    }
  }
}
