export interface CamelState {
  id: number;
  x: number;
  y: number;
  stamina: number;
  maxStamina: number;
  load: number;
  maxLoad: number;
  water: number;
  maxWater: number;
  isAlive: boolean;
  legPhase: number;
  walkCycle: number;
  direction: number;
}

export class Camel {
  public state: CamelState;
  private targetX: number;
  private targetY: number;
  private isMoving: boolean;
  private speed: number;
  private baseSpeed: number;

  constructor(id: number, x: number, y: number) {
    this.state = {
      id,
      x,
      y,
      stamina: 100,
      maxStamina: 100,
      load: 30,
      maxLoad: 80,
      water: 100,
      maxWater: 100,
      isAlive: true,
      legPhase: Math.random() * Math.PI * 2,
      walkCycle: 0,
      direction: 0
    };
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.baseSpeed = 1.2;
    this.speed = this.baseSpeed;
  }

  public setTarget(x: number, y: number): void {
    if (!this.state.isAlive) return;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
    const dx = x - this.state.x;
    const dy = y - this.state.y;
    this.state.direction = Math.atan2(dy, dx);
  }

  public stop(): void {
    this.isMoving = false;
    this.targetX = this.state.x;
    this.targetY = this.state.y;
  }

  public update(deltaTime: number, waterConsumption: number, staminaConsumption: number): boolean {
    if (!this.state.isAlive) return false;

    let moved = false;

    if (this.isMoving) {
      const dx = this.targetX - this.state.x;
      const dy = this.targetY - this.state.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.speed) {
        this.state.x += (dx / distance) * this.speed;
        this.state.y += (dy / distance) * this.speed;
        this.state.walkCycle += this.speed * 0.15;
        this.state.legPhase += 0.3;
        moved = true;
      } else {
        this.state.x = this.targetX;
        this.state.y = this.targetY;
        this.isMoving = false;
      }

      this.state.water -= waterConsumption;
      this.state.stamina -= staminaConsumption;

      if (this.state.water <= 0) {
        this.state.water = 0;
        this.state.stamina -= staminaConsumption * 2;
      }

      if (this.state.stamina <= 0) {
        this.state.stamina = 0;
        this.state.isAlive = false;
        this.isMoving = false;
      }
    }

    return moved;
  }

  public drinkWater(amount: number): number {
    const actualAmount = Math.min(amount, this.state.maxWater - this.state.water);
    this.state.water = Math.min(this.state.maxWater, this.state.water + amount);
    return actualAmount;
  }

  public rest(recoveryRate: number): void {
    if (!this.state.isAlive) return;
    this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + recoveryRate);
  }

  public addLoad(amount: number): boolean {
    if (this.state.load + amount > this.state.maxLoad) return false;
    this.state.load += amount;
    this.speed = this.baseSpeed * (1 - (this.state.load / this.state.maxLoad) * 0.3);
    return true;
  }

  public removeLoad(amount: number): number {
    const actualAmount = Math.min(amount, this.state.load);
    this.state.load -= actualAmount;
    this.speed = this.baseSpeed * (1 - (this.state.load / this.state.maxLoad) * 0.3);
    return actualAmount;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speed = this.baseSpeed * multiplier * (1 - (this.state.load / this.state.maxLoad) * 0.3);
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  public isMovingState(): boolean {
    return this.isMoving;
  }

  public takeDamage(amount: number): void {
    if (!this.state.isAlive) return;
    this.state.stamina -= amount;
    if (this.state.stamina <= 0) {
      this.state.stamina = 0;
      this.state.isAlive = false;
      this.isMoving = false;
    }
  }
}
