import { Grid, GRID_SIZE } from './grid';
import { Photon, PhotonColor, PhotonState } from './photon';

export interface ChainEvent {
  type: 'superpose' | 'collapse';
  photonA: Photon;
  photonB?: Photon;
  removedPhotons?: Photon[];
}

export class ChainResolver {
  grid: Grid;
  chainInterval: number = 0.8;
  chainTimer: number = 0;
  chainLevel: number = 0;
  pendingChain: boolean = false;
  affectedCells: Set<string>;

  constructor(grid: Grid) {
    this.grid = grid;
    this.affectedCells = new Set();
  }

  resetChainState() {
    this.chainTimer = 0;
    this.chainLevel = 0;
    this.pendingChain = false;
    this.affectedCells.clear();
  }

  markAffected(x: number, y: number) {
    this.affectedCells.add(`${x},${y}`);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          this.affectedCells.add(`${nx},${ny}`);
        }
      }
    }
  }

  findNextChainEvent(): ChainEvent | null {
    const collapses = this.grid.findCollapses();
    if (collapses.length > 0) {
      return {
        type: 'collapse',
        photonA: collapses[0],
      };
    }

    const superpositions = this.grid.findSuperpositions();
    if (superpositions.length > 0) {
      const pair = superpositions[0];
      return {
        type: 'superpose',
        photonA: pair.photon,
        photonB: pair.neighbor,
      };
    }

    return null;
  }

  findChainEventInAffected(): ChainEvent | null {
    for (const key of this.affectedCells) {
      const [x, y] = key.split(',').map(Number);
      const photon = this.grid.getPhoton(x, y);
      if (!photon) continue;

      if (photon.energyLevel >= 2) {
        const neighbors = this.grid.getAdjacentCells(x, y);
        for (const n of neighbors) {
          const neighbor = this.grid.getPhoton(n.x, n.y);
          if (neighbor && neighbor.color === photon.color) {
            return { type: 'collapse', photonA: photon };
          }
        }
      }

      if (photon.energyLevel === 1) {
        const neighbors = this.grid.getAdjacentCells(x, y);
        for (const n of neighbors) {
          const neighbor = this.grid.getPhoton(n.x, n.y);
          if (neighbor && neighbor.energyLevel === 1 && neighbor.color === photon.color) {
            return { type: 'superpose', photonA: photon, photonB: neighbor };
          }
        }
      }
    }

    return this.findNextChainEvent();
  }

  updateIntervalTimer(dt: number): boolean {
    if (!this.pendingChain) return false;
    this.chainTimer += dt;
    if (this.chainTimer >= this.chainInterval) {
      this.chainTimer = 0;
      this.pendingChain = false;
      return true;
    }
    return false;
  }

  scheduleChainAt(x: number, y: number) {
    this.markAffected(x, y);
    this.pendingChain = true;
    this.chainTimer = 0;
  }

  processCollapseAndMarkAffected(event: ChainEvent): Photon[] {
    const x = event.photonA.gridX;
    const y = event.photonA.gridY;
    const removed = this.grid.removePhotonAndAdjacent(x, y);
    for (const p of removed) {
      this.markAffected(p.gridX, p.gridY);
    }
    this.chainLevel++;
    return removed;
  }

  processSuperpositionAndMarkAffected(event: ChainEvent): Photon {
    const result = this.grid.superpose(event.photonA, event.photonB!);
    this.markAffected(result.gridX, result.gridY);
    this.chainLevel++;
    return result;
  }

  recursivelyFindAllChains(): ChainEvent[] {
    const events: ChainEvent[] = [];
    let safeCount = 0;
    while (safeCount < 100) {
      const ev = this.findChainEventInAffected();
      if (!ev) break;
      events.push(ev);
      if (ev.type === 'collapse') {
        const x = ev.photonA.gridX;
        const y = ev.photonA.gridY;
        this.markAffected(x, y);
        const adj = this.grid.getAdjacentCells(x, y);
        for (const n of adj) {
          const nb = this.grid.getPhoton(n.x, n.y);
          if (nb && nb.color === ev.photonA.color) {
            this.markAffected(nb.gridX, nb.gridY);
          }
        }
      } else if (ev.photonB) {
        this.markAffected(ev.photonA.gridX, ev.photonA.gridY);
        this.markAffected(ev.photonB.gridX, ev.photonB.gridY);
      }
      safeCount++;
    }
    return events;
  }

  processSuperposition(event: ChainEvent): Photon {
    const p1 = event.photonA;
    const p2 = event.photonB!;
    return this.grid.superpose(p1, p2);
  }

  processCollapse(event: ChainEvent): Photon[] {
    return this.grid.removePhotonAndAdjacent(event.photonA.gridX, event.photonA.gridY);
  }

  calculateScore(removedCount: number, chainLevel: number): number {
    const base = removedCount * 10;
    const chainBonus = chainLevel > 1 ? (chainLevel - 1) * 5 * removedCount : 0;
    return base + chainBonus;
  }

  hasMoreChains(): boolean {
    return this.findNextChainEvent() !== null;
  }
}
