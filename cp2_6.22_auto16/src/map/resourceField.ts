export enum ResourceType {
  IRON = 'iron',
  CRYSTAL = 'crystal',
  GAS = 'gas'
}

export const ResourceColors: Record<ResourceType, number> = {
  [ResourceType.IRON]: 0xff8c3c,
  [ResourceType.CRYSTAL]: 0x60a5fa,
  [ResourceType.GAS]: 0x4ade80
};

export class ResourceField {
  id: string;
  type: ResourceType;
  x: number;
  y: number;
  totalReserve: number;
  remaining: number;
  efficiency: number;
  scale: number = 1;
  isDepleted: boolean = false;
  pulsePhase: number;
  depleteAnimTime: number = -1;
  sprite?: any;

  constructor(id: string, type: ResourceType, x: number, y: number, reserve: number, efficiency: number) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.totalReserve = reserve;
    this.remaining = reserve;
    this.efficiency = efficiency;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  harvest(amount: number): number {
    if (this.isDepleted || this.remaining <= 0) return 0;
    const actual = Math.min(amount, this.remaining);
    this.remaining -= actual;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.isDepleted = true;
      this.depleteAnimTime = 0;
    }
    return actual;
  }

  updateVisual(delta: number): void {
    this.pulsePhase += delta * 2;
    const reserveRatio = this.remaining / this.totalReserve;
    this.scale = 0.6 + reserveRatio * 0.6;
    if (this.isDepleted && this.depleteAnimTime >= 0) {
      this.depleteAnimTime += delta;
    }
  }

  getResourceColor(): number {
    return ResourceColors[this.type];
  }

  getTypeName(): string {
    return this.type;
  }

  isAlive(): boolean {
    return !this.isDepleted || this.depleteAnimTime < 0 || this.depleteAnimTime < 1;
  }
}
