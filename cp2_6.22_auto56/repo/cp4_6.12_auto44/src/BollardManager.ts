import { Bollard, Ship, BollardStatus } from './types';
import { EventBus } from './EventBus';

export class BollardManager {
  private bollards: Bollard[];
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.bollards = [
      {
        id: 'bollard-1',
        x: 400,
        y: 200,
        status: 'idle',
        maxDepth: 15,
        craneCount: 2,
      },
      {
        id: 'bollard-2',
        x: 400,
        y: 400,
        status: 'idle',
        maxDepth: 12,
        craneCount: 1,
      },
      {
        id: 'bollard-3',
        x: 400,
        y: 600,
        status: 'idle',
        maxDepth: 10,
        craneCount: 2,
      },
    ];

    this.eventBus.on('shipLeft', this.handleShipLeft.bind(this));
  }

  public getBollards(): Bollard[] {
    return [...this.bollards];
  }

  public allocateBollard(ship: Ship): Bollard | null {
    const idleBollards = this.bollards.filter(
      (b) => b.status === 'idle' && b.maxDepth >= ship.draft
    );

    if (idleBollards.length === 0) {
      return null;
    }

    idleBollards.sort((a, b) => {
      if (b.craneCount !== a.craneCount) {
        return b.craneCount - a.craneCount;
      }
      const distA = Math.hypot(a.x - ship.x, a.y - ship.y);
      const distB = Math.hypot(b.x - ship.x, b.y - ship.y);
      return distA - distB;
    });

    const allocatedBollard = idleBollards[0];
    allocatedBollard.status = 'occupied';
    allocatedBollard.shipId = ship.id;

    this.eventBus.emit('bollardAllocated', { bollard: allocatedBollard, ship });

    return allocatedBollard;
  }

  public freeBollard(bollardId: string): void {
    const bollard = this.bollards.find((b) => b.id === bollardId);
    if (bollard && bollard.status === 'occupied') {
      bollard.status = 'idle';
      bollard.shipId = undefined;
      this.eventBus.emit('bollardFreed', { bollard });
    }
  }

  private handleShipLeft(data: { ship: Ship }): void {
    const { ship } = data;
    if (ship.bollardId) {
      this.freeBollard(ship.bollardId);
    }
  }
}
