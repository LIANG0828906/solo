export interface ShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  fuel: number;
}

export class Ship {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public rotation: number;
  public fuel: number;

  public readonly maxSpeed: number = 6;
  public readonly acceleration: number = 0.3;
  public readonly friction: number = 0.95;
  public readonly rotationSpeed: number = (3 * Math.PI) / 180;
  public readonly maxFuel: number = 100;
  public readonly size: number = 32;

  private keys: Set<string> = new Set();
  private targetRotation: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = -Math.PI / 2;
    this.targetRotation = this.rotation;
    this.fuel = this.maxFuel;
  }

  public handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
  }

  public handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  public update(nearAsteroid: boolean, canvasWidth: number, canvasHeight: number): void {
    const fuelConsumptionPerFrame = 0.5 / 60;
    let consumption = fuelConsumptionPerFrame;
    if (nearAsteroid) {
      consumption *= 2;
    }
    this.fuel = Math.max(0, this.fuel - consumption);

    let ax = 0;
    let ay = 0;
    let moving = false;

    if (this.fuel > 0) {
      if (this.keys.has('w')) {
        ay -= this.acceleration;
        moving = true;
      }
      if (this.keys.has('s')) {
        ay += this.acceleration;
        moving = true;
      }
      if (this.keys.has('a')) {
        ax -= this.acceleration;
        moving = true;
      }
      if (this.keys.has('d')) {
        ax += this.acceleration;
        moving = true;
      }
    }

    if (moving) {
      this.targetRotation = Math.atan2(ay, ax);
      const diff = this.normalizeAngle(this.targetRotation - this.rotation);
      const maxDiff = this.rotationSpeed;
      if (Math.abs(diff) > maxDiff) {
        this.rotation += Math.sign(diff) * maxDiff;
      } else {
        this.rotation = this.targetRotation;
      }
    }

    this.vx *= this.friction;
    this.vy *= this.friction;

    this.vx += ax;
    this.vy += ay;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    if (this.fuel <= 0) {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    this.x += this.vx;
    this.y += this.vy;

    const halfSize = this.size / 2;
    this.x = Math.max(halfSize, Math.min(canvasWidth - halfSize, this.x));
    this.y = Math.max(halfSize, Math.min(canvasHeight - halfSize, this.y));
  }

  public getState(): ShipState {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      rotation: this.rotation,
      fuel: this.fuel,
    };
  }

  public resetFuel(): void {
    this.fuel = this.maxFuel;
  }

  public refuel(amount: number): void {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }
}
