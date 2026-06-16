import { Photon, PhotonColor, COLORS, PhotonState } from './photon';

export const GRID_SIZE = 4;
export const CELL_SIZE = 80;
export const PHOTON_RADIUS = 25;

export class Grid {
  cells: (Photon | null)[][];
  nextPhotonColor: PhotonColor;

  constructor() {
    this.cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.cells[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.cells[y][x] = null;
      }
    }
    this.nextPhotonColor = Photon.randomColor();
  }

  init() {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const empty = this.getEmptyCells();
      if (empty.length === 0) break;
      const cell = empty[Math.floor(Math.random() * empty.length)];
      const color = Photon.randomColor();
      const photon = new Photon(color, cell.x, cell.y);
      this.cells[cell.y][cell.x] = photon;
    }
  }

  getEmptyCells(): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.cells[y][x] === null) {
          result.push({ x, y });
        }
      }
    }
    return result;
  }

  getPhoton(x: number, y: number): Photon | null {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return this.cells[y][x];
  }

  isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (dx + dy === 1) || (dx === 1 && dy === 1);
  }

  isEmpty(x: number, y: number): boolean {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && this.cells[y][x] === null;
  }

  movePhoton(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.isEmpty(toX, toY)) return false;
    if (!this.isAdjacent(fromX, fromY, toX, toY)) return false;
    const photon = this.cells[fromY][fromX];
    if (!photon) return false;
    this.cells[fromY][fromX] = null;
    photon.gridX = toX;
    photon.gridY = toY;
    this.cells[toY][toX] = photon;
    return true;
  }

  getAdjacentCells(x: number, y: number): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          result.push({ x: nx, y: ny });
        }
      }
    }
    return result;
  }

  findSuperpositions(): { photon: Photon; neighbor: Photon }[] {
    const results: { photon: Photon; neighbor: Photon }[] = [];
    const checked = new Set<string>();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const photon = this.cells[y][x];
        if (!photon || photon.energyLevel > 1) continue;
        const neighbors = this.getAdjacentCells(x, y);
        for (const n of neighbors) {
          const neighbor = this.cells[n.y][n.x];
          if (!neighbor || neighbor.energyLevel > 1) continue;
          if (photon.color === neighbor.color) {
            const key = [x, y, n.x, n.y].sort((a, b) => a - b).join(',');
            if (!checked.has(key)) {
              checked.add(key);
              results.push({ photon, neighbor });
            }
          }
        }
      }
    }
    return results;
  }

  findCollapses(): Photon[] {
    const results: Photon[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const photon = this.cells[y][x];
        if (!photon || photon.energyLevel < 2) continue;
        const neighbors = this.getAdjacentCells(x, y);
        for (const n of neighbors) {
          const neighbor = this.cells[n.y][n.x];
          if (neighbor && neighbor.color === photon.color) {
            results.push(photon);
            break;
          }
        }
      }
    }
    return results;
  }

  removePhotonAndAdjacent(x: number, y: number): Photon[] {
    const photon = this.cells[y][x];
    if (!photon) return [];
    const removed: Photon[] = [photon];
    this.cells[y][x] = null;
    const neighbors = this.getAdjacentCells(x, y);
    for (const n of neighbors) {
      const neighbor = this.cells[n.y][n.x];
      if (neighbor && neighbor.color === photon.color) {
        removed.push(neighbor);
        this.cells[n.y][n.x] = null;
      }
    }
    return removed;
  }

  superpose(p1: Photon, p2: Photon): Photon {
    this.cells[p2.gridY][p2.gridX] = null;
    p1.energyLevel = 2;
    p1.targetScale = 1.2;
    return p1;
  }

  addRandomPhoton(): Photon | null {
    const empty = this.getEmptyCells();
    if (empty.length === 0) return null;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    const photon = new Photon(this.nextPhotonColor, cell.x, cell.y);
    this.cells[cell.y][cell.x] = photon;
    this.nextPhotonColor = Photon.randomColor();
    return photon;
  }

  shiftDown(): { shifted: Photon[]; removed: Photon[]; newPhotons: Photon[] } {
    const removed: Photon[] = [];
    const shifted: Photon[] = [];
    const newPhotons: Photon[] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      const photon = this.cells[GRID_SIZE - 1][x];
      if (photon) {
        photon.state = PhotonState.Fading;
        removed.push(photon);
      }
      this.cells[GRID_SIZE - 1][x] = null;
    }

    for (let y = GRID_SIZE - 1; y > 0; y--) {
      for (let x = 0; x < GRID_SIZE; x++) {
        this.cells[y][x] = this.cells[y - 1][x];
        if (this.cells[y][x]) {
          this.cells[y][x].gridY = y;
          this.cells[y][x].state = PhotonState.Shifting;
          shifted.push(this.cells[y][x]);
        }
      }
    }

    for (let x = 0; x < GRID_SIZE; x++) {
      this.cells[0][x] = null;
    }

    const positions = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const x = positions[i];
      const color = Photon.randomColor();
      const photon = new Photon(color, x, 0);
      this.cells[0][x] = photon;
      newPhotons.push(photon);
    }

    return { shifted, removed, newPhotons };
  }

  isGameOver(): boolean {
    if (this.getEmptyCells().length > 0) return false;
    if (this.findSuperpositions().length > 0) return false;
    if (this.findCollapses().length > 0) return false;
    return true;
  }

  clear() {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        this.cells[y][x] = null;
      }
    }
  }
}
