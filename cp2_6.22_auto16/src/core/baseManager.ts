export interface UpgradeCost {
  iron: number;
  crystal: number;
  gas: number;
}

export interface Warehouse {
  iron: number;
  crystal: number;
  gas: number;
  capacity: number;
}

export class Base {
  id: string;
  name: string;
  level: number = 1;
  x: number;
  y: number;
  warehouse: Warehouse;
  buildSpeed: number = 1;
  upgradeRippleTime: number = -1;
  sprite?: any;

  constructor(id: string, name: string, x: number, y: number) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.warehouse = {
      iron: 0,
      crystal: 0,
      gas: 0,
      capacity: 500
    };
    this.buildSpeed = 1;
  }

  getInfluenceRadius(): number {
    return this.level;
  }

  getUpgradeCost(): UpgradeCost | null {
    const costTable: Record<number, UpgradeCost> = {
      1: { iron: 100, crystal: 50, gas: 30 },
      2: { iron: 250, crystal: 150, gas: 80 },
      3: { iron: 500, crystal: 300, gas: 200 },
      4: { iron: 1000, crystal: 600, gas: 400 }
    };
    if (this.level >= 5) return null;
    return costTable[this.level] || null;
  }

  canUpgrade(): boolean {
    const cost = this.getUpgradeCost();
    if (!cost) return false;
    return (
      this.warehouse.iron >= cost.iron &&
      this.warehouse.crystal >= cost.crystal &&
      this.warehouse.gas >= cost.gas
    );
  }

  triggerUpgrade(): boolean {
    const cost = this.getUpgradeCost();
    if (!cost || !this.canUpgrade()) return false;
    this.warehouse.iron -= cost.iron;
    this.warehouse.crystal -= cost.crystal;
    this.warehouse.gas -= cost.gas;
    this.level++;
    this.upgradeRippleTime = 0;
    return true;
  }
}

export class BaseManager {
  bases: Map<string, Base>;
  eventTarget: EventTarget;
  nextId: number;
  totalHarvested: { iron: number; crystal: number; gas: number };
  piratesDefeated: number;
  runTime: number;

  constructor() {
    this.bases = new Map();
    this.eventTarget = new EventTarget();
    this.nextId = 1;
    this.totalHarvested = { iron: 0, crystal: 0, gas: 0 };
    this.piratesDefeated = 0;
    this.runTime = 0;
  }

  createBase(x: number, y: number, name?: string): Base {
    const id = `base_${this.nextId++}`;
    const baseName = name || `Base ${this.nextId - 1}`;
    const base = new Base(id, baseName, x, y);
    this.bases.set(id, base);
    return base;
  }

  getBase(id: string): Base | undefined {
    return this.bases.get(id);
  }

  getAllBases(): Base[] {
    return Array.from(this.bases.values());
  }

  upgradeBase(id: string): boolean {
    const base = this.bases.get(id);
    if (!base) return false;
    return base.triggerUpgrade();
  }

  depositResources(
    baseId: string,
    cargo: { iron: number; crystal: number; gas: number }
  ): { iron: number; crystal: number; gas: number } {
    const base = this.bases.get(baseId);
    const deposited = { iron: 0, crystal: 0, gas: 0 };
    if (!base) return deposited;

    const currentTotal =
      base.warehouse.iron + base.warehouse.crystal + base.warehouse.gas;
    const remainingCapacity = Math.max(0, base.warehouse.capacity - currentTotal);

    if (remainingCapacity <= 0) return deposited;

    const cargoTotal = cargo.iron + cargo.crystal + cargo.gas;
    if (cargoTotal <= remainingCapacity) {
      base.warehouse.iron += cargo.iron;
      base.warehouse.crystal += cargo.crystal;
      base.warehouse.gas += cargo.gas;
      deposited.iron = cargo.iron;
      deposited.crystal = cargo.crystal;
      deposited.gas = cargo.gas;
    } else {
      const ratio = remainingCapacity / cargoTotal;
      const ironDeposit = Math.floor(cargo.iron * ratio);
      const crystalDeposit = Math.floor(cargo.crystal * ratio);
      const gasDeposit = Math.floor(cargo.gas * ratio);
      base.warehouse.iron += ironDeposit;
      base.warehouse.crystal += crystalDeposit;
      base.warehouse.gas += gasDeposit;
      deposited.iron = ironDeposit;
      deposited.crystal = crystalDeposit;
      deposited.gas = gasDeposit;
    }

    this.totalHarvested.iron += deposited.iron;
    this.totalHarvested.crystal += deposited.crystal;
    this.totalHarvested.gas += deposited.gas;

    return deposited;
  }

  update(delta: number): void {
    this.runTime += delta;
    for (const base of this.bases.values()) {
      if (base.upgradeRippleTime >= 0) {
        base.upgradeRippleTime += delta;
      }
    }
  }
}
