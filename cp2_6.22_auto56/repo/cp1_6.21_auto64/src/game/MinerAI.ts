import { v4 as uuidv4 } from 'uuid';
import { MineralType, Coordinate } from './types';

export type ShipStatus = 'idle' | 'moving' | 'mining' | 'returning';

export interface CarriedMineral {
  type: MineralType;
  amount: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export interface Ship {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  cargo: CarriedMineral[];
  cargoCapacity: number;
  currentCargo: number;
  miningProgress: number;
  miningInterval: number;
  speed: number;
  flashTimer: number;
  trail: TrailPoint[];
  targetGridX: number;
  targetGridY: number;
}

export interface Resources {
  gold: number;
  iron: number;
  crystal: number;
}

export interface StarFieldInterface {
  getMinerals(): any[];
  getGridCell(gx: number, gy: number): any[];
  getConfig(): { width: number; height: number; gridSize: number };
  gridToPixel(gx: number, gy: number): Coordinate;
  pixelToGrid(x: number, y: number): { gridX: number; gridY: number };
  getMineralById(id: string): any;
  startCollecting(id: string): void;
  removeMineral(id: string): void;
}

export class MinerAI {
  private ships: Ship[] = [];
  private baseX: number;
  private baseY: number;
  private starField: StarFieldInterface;
  private miningSpeedMultiplier: number = 1;
  private onResourcesCollected: ((resources: Resources) => void) | null = null;

  constructor(starField: StarFieldInterface, baseX: number = 400, baseY: number = 400) {
    this.starField = starField;
    this.baseX = baseX;
    this.baseY = baseY;
    this.initializeShips();
  }

  private initializeShips(): void {
    for (let i = 0; i < 3; i++) {
      this.ships.push(this.createShip(`矿船-${i + 1}`, this.baseX + (i - 1) * 30, this.baseY));
    }
  }

  private createShip(name: string, x: number, y: number): Ship {
    return {
      id: uuidv4(),
      name,
      x,
      y,
      targetX: x,
      targetY: y,
      status: 'idle',
      health: 100,
      maxHealth: 100,
      cargo: [],
      cargoCapacity: 10,
      currentCargo: 0,
      miningProgress: 0,
      miningInterval: 2,
      speed: 60,
      flashTimer: 0,
      trail: [],
      targetGridX: -1,
      targetGridY: -1
    };
  }

  getShips(): Ship[] {
    return this.ships;
  }

  setOnResourcesCollected(callback: (resources: Resources) => void): void {
    this.onResourcesCollected = callback;
  }

  setMiningSpeedMultiplier(multiplier: number): void {
    this.miningSpeedMultiplier = multiplier;
  }

  sendShipToMine(shipId: string, gridX: number, gridY: number): boolean {
    const ship = this.ships.find(s => s.id === shipId);
    if (!ship || ship.status !== 'idle') return false;

    const cellMinerals = this.starField.getGridCell(gridX, gridY);
    if (cellMinerals.length === 0) return false;

    const target = this.starField.gridToPixel(gridX, gridY);
    ship.targetX = target.x;
    ship.targetY = target.y;
    ship.targetGridX = gridX;
    ship.targetGridY = gridY;
    ship.status = 'moving';
    return true;
  }

  update(timeDelta: number): void {
    for (const ship of this.ships) {
      this.updateShipTrail(ship, timeDelta);
      
      if (ship.flashTimer > 0) {
        ship.flashTimer -= timeDelta;
      }

      switch (ship.status) {
        case 'moving':
          this.moveShip(ship, timeDelta);
          break;
        case 'mining':
          this.mineMinerals(ship, timeDelta);
          break;
        case 'returning':
          this.returnToBase(ship, timeDelta);
          break;
      }
    }
  }

  private updateShipTrail(ship: Ship, timeDelta: number): void {
    if (ship.status === 'moving' || ship.status === 'returning') {
      ship.trail.push({ x: ship.x, y: ship.y, age: 0 });
    }
    for (let i = ship.trail.length - 1; i >= 0; i--) {
      ship.trail[i].age += timeDelta;
      if (ship.trail[i].age > 1) {
        ship.trail.splice(i, 1);
      }
    }
  }

  private moveShip(ship: Ship, timeDelta: number): void {
    const dx = ship.targetX - ship.x;
    const dy = ship.targetY - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      ship.x = ship.targetX;
      ship.y = ship.targetY;
      ship.status = 'mining';
      ship.miningProgress = 0;
      return;
    }

    const moveDistance = ship.speed * timeDelta;
    const ratio = moveDistance / distance;
    ship.x += dx * ratio;
    ship.y += dy * ratio;
  }

  private mineMinerals(ship: Ship, timeDelta: number): void {
    if (ship.currentCargo >= ship.cargoCapacity) {
      ship.status = 'returning';
      ship.targetX = this.baseX;
      ship.targetY = this.baseY;
      return;
    }

    const cellMinerals = this.starField.getGridCell(ship.targetGridX, ship.targetGridY);
    if (cellMinerals.length === 0) {
      if (ship.currentCargo > 0) {
        ship.status = 'returning';
        ship.targetX = this.baseX;
        ship.targetY = this.baseY;
      } else {
        ship.status = 'idle';
      }
      return;
    }

    ship.miningProgress += timeDelta * this.miningSpeedMultiplier;
    const adjustedInterval = ship.miningInterval / this.miningSpeedMultiplier;
    
    if (ship.miningProgress >= adjustedInterval) {
      ship.miningProgress = 0;
      ship.flashTimer = 0.1;
      
      const availableMinerals = cellMinerals.filter(m => !m.collecting);
      if (availableMinerals.length > 0) {
        const mineral = availableMinerals[0];
        this.starField.startCollecting(mineral.id);
        
        const existingCargo = ship.cargo.find(c => c.type === mineral.type);
        if (existingCargo) {
          existingCargo.amount++;
        } else {
          ship.cargo.push({ type: mineral.type, amount: 1 });
        }
        ship.currentCargo++;

        setTimeout(() => {
          this.starField.removeMineral(mineral.id);
        }, 300);
      } else {
        if (ship.currentCargo > 0) {
          ship.status = 'returning';
          ship.targetX = this.baseX;
          ship.targetY = this.baseY;
        } else {
          ship.status = 'idle';
        }
      }
    }
  }

  private returnToBase(ship: Ship, timeDelta: number): void {
    const dx = ship.targetX - ship.x;
    const dy = ship.targetY - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      ship.x = this.baseX;
      ship.y = this.baseY;
      this.depositCargo(ship);
      ship.status = 'idle';
      return;
    }

    const moveDistance = ship.speed * timeDelta;
    const ratio = moveDistance / distance;
    ship.x += dx * ratio;
    ship.y += dy * ratio;
  }

  private depositCargo(ship: Ship): void {
    const resources: Resources = { gold: 0, iron: 0, crystal: 0 };
    
    for (const cargo of ship.cargo) {
      resources[cargo.type] += cargo.amount;
    }
    
    ship.cargo = [];
    ship.currentCargo = 0;

    if (this.onResourcesCollected) {
      this.onResourcesCollected(resources);
    }
  }

  getBasePosition(): Coordinate {
    return { x: this.baseX, y: this.baseY };
  }

  damageShip(shipId: string, damage: number): void {
    const ship = this.ships.find(s => s.id === shipId);
    if (ship) {
      ship.health = Math.max(0, ship.health - damage);
    }
  }

  setShips(ships: Ship[]): void {
    this.ships = ships;
  }

  addShip(name: string): void {
    this.ships.push(this.createShip(name, this.baseX, this.baseY));
  }
}
