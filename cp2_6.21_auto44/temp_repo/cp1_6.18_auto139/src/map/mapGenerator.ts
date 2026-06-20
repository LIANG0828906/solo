import { TerrainType, HexCell, AxialCoord, PlayerType, HeroUnit } from '../types';

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 6;
export const HEX_RADIUS = 30;

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_RADIUS * (3 / 2 * q);
  const y = HEX_RADIUS * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}

export function pixelToHex(x: number, y: number): AxialCoord {
  const q = (2 / 3 * x) / HEX_RADIUS;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_RADIUS;
  return axialRound(q, r);
}

function axialRound(q: number, r: number): AxialCoord {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

export function getHexNeighbors(coord: AxialCoord): AxialCoord[] {
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];
  return directions.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function isHexInBounds(coord: AxialCoord): boolean {
  return coord.q >= 0 && coord.q < GRID_WIDTH && coord.r >= 0 && coord.r < GRID_HEIGHT;
}

export function getHexDistance(a: AxialCoord, b: AxialCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function isAdjacent(a: AxialCoord, b: AxialCoord): boolean {
  return getHexDistance(a, b) === 1;
}

export class MapGenerator {
  private random: SeededRandom;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generateGrid(): HexCell[][] {
    const grid: HexCell[][] = [];

    for (let r = 0; r < GRID_HEIGHT; r++) {
      grid[r] = [];
      for (let q = 0; q < GRID_WIDTH; q++) {
        const terrain = this.generateTerrain(q, r);
        grid[r][q] = { q, r, terrain };
      }
    }

    return grid;
  }

  private generateTerrain(q: number, r: number): TerrainType {
    const isEdge = q === 0 || q === GRID_WIDTH - 1 || r === 0 || r === GRID_HEIGHT - 1;

    if (isEdge && this.random.next() < 0.35) {
      return TerrainType.ROCK;
    }

    if (this.random.next() < 0.18) {
      return TerrainType.FOREST;
    }

    if (this.random.next() < 0.12) {
      return TerrainType.ROCK;
    }

    return TerrainType.PLAIN;
  }

  generateUnits(grid: HexCell[][]): HeroUnit[] {
    const units: HeroUnit[] = [];
    const heroNames = [
      { name: '骑士', initials: 'QS' },
      { name: '法师', initials: 'FS' },
      { name: '弓手', initials: 'GS' }
    ];

    const blueStartPositions = this.findStartingPositions(grid, PlayerType.BLUE);
    const redStartPositions = this.findStartingPositions(grid, PlayerType.RED);

    for (let i = 0; i < 3; i++) {
      units.push({
        id: `blue_${i}`,
        name: heroNames[i].name,
        initials: heroNames[i].initials,
        player: PlayerType.BLUE,
        position: blueStartPositions[i],
        previousPosition: null,
        attack: this.random.nextInt(8, 15),
        defense: this.random.nextInt(5, 10),
        maxHp: this.random.nextInt(50, 100),
        hp: 0,
        maxMoveSteps: this.random.nextInt(3, 5),
        moveSteps: 0,
        hasActed: false,
        isAnimating: false
      });
      units[units.length - 1].hp = units[units.length - 1].maxHp;
      units[units.length - 1].moveSteps = units[units.length - 1].maxMoveSteps;
    }

    for (let i = 0; i < 3; i++) {
      units.push({
        id: `red_${i}`,
        name: heroNames[i].name,
        initials: heroNames[i].initials,
        player: PlayerType.RED,
        position: redStartPositions[i],
        previousPosition: null,
        attack: this.random.nextInt(8, 15),
        defense: this.random.nextInt(5, 10),
        maxHp: this.random.nextInt(50, 100),
        hp: 0,
        maxMoveSteps: this.random.nextInt(3, 5),
        moveSteps: 0,
        hasActed: false,
        isAnimating: false
      });
      units[units.length - 1].hp = units[units.length - 1].maxHp;
      units[units.length - 1].moveSteps = units[units.length - 1].maxMoveSteps;
    }

    return units;
  }

  private findStartingPositions(grid: HexCell[][], player: PlayerType): AxialCoord[] {
    const positions: AxialCoord[] = [];
    const startCol = player === PlayerType.BLUE ? 0 : GRID_WIDTH - 1;
    const rows = [1, Math.floor(GRID_HEIGHT / 2), GRID_HEIGHT - 2];

    for (const row of rows) {
      if (grid[row] && grid[row][startCol] && grid[row][startCol].terrain !== TerrainType.ROCK) {
        positions.push({ q: startCol, r: row });
      }
    }

    if (positions.length < 3) {
      for (let r = 0; r < GRID_HEIGHT && positions.length < 3; r++) {
        if (grid[r] && grid[r][startCol] && grid[r][startCol].terrain !== TerrainType.ROCK) {
          const exists = positions.some(p => p.r === r);
          if (!exists) {
            positions.push({ q: startCol, r });
          }
        }
      }
    }

    return positions;
  }

  getTerrainDefenseBonus(terrain: TerrainType): number {
    switch (terrain) {
      case TerrainType.FOREST:
        return 0.2;
      default:
        return 0;
    }
  }
}
