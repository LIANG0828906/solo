export type ChargeType = 'positive' | 'negative';

export interface ChargeData {
  id: string;
  position: { x: number; y: number; z: number };
  charge: number;
  type: ChargeType;
}

export class Charge {
  public id: string;
  public position: { x: number; y: number; z: number };
  public charge: number;
  public type: ChargeType;

  constructor(
    id: string,
    position: { x: number; y: number; z: number },
    charge: number
  ) {
    this.id = id;
    this.position = { ...position };
    this.charge = charge;
    this.type = charge >= 0 ? 'positive' : 'negative';
  }

  update(deltaTime: number): void {
    // Placeholder for future dynamic behavior
    void deltaTime;
  }

  toJSON(): ChargeData {
    return {
      id: this.id,
      position: { ...this.position },
      charge: this.charge,
      type: this.type,
    };
  }
}

export class ChargeSystem {
  private charges: Map<string, Charge> = new Map();
  private listeners: Set<() => void> = new Set();

  addCharge(position: { x: number; y: number; z: number }, chargeValue: number): Charge {
    const id = `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const charge = new Charge(id, position, chargeValue);
    this.charges.set(id, charge);
    this.notifyListeners();
    return charge;
  }

  removeCharge(id: string): boolean {
    const result = this.charges.delete(id);
    if (result) {
      this.notifyListeners();
    }
    return result;
  }

  getCharge(id: string): Charge | undefined {
    return this.charges.get(id);
  }

  getAllCharges(): Charge[] {
    return Array.from(this.charges.values());
  }

  getChargeCount(): number {
    return this.charges.size;
  }

  update(deltaTime: number): void {
    for (const charge of this.charges.values()) {
      charge.update(deltaTime);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
