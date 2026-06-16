import { Grid } from './grid';
import { Photon, PhotonColor } from './photon';

export interface ChainEvent {
  type: 'superpose' | 'collapse';
  photonA: Photon;
  photonB?: Photon;
  removedPhotons?: Photon[];
}

export class ChainResolver {
  grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
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
