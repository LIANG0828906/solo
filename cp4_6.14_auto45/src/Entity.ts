export interface Vec2 {
  x: number;
  y: number;
}

export abstract class Entity {
  protected x: number;
  protected y: number;
  protected vx: number;
  protected vy: number;
  protected rotation: number;
  protected alive: boolean;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.alive = true;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getRotation(): number {
    return this.rotation;
  }

  public setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public destroy(): void {
    this.alive = false;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  public getVelocity(): Vec2 {
    return { x: this.vx, y: this.vy };
  }

  public abstract update(dt: number): void;
  public abstract render(ctx: CanvasRenderingContext2D): void;
}

export class Laser extends Entity {
  private ownerId: number;
  private length: number;
  private width: number;
  private damage: number;
  private color: string;
  private lifetime: number;
  private age: number;

  constructor(
    x: number,
    y: number,
    angle: number,
    speed: number,
    ownerId: number,
    length: number = 200,
    width: number = 4,
    damage: number = 20,
    color: string = '#00ffff'
  ) {
    super(x, y);
    this.ownerId = ownerId;
    this.length = length;
    this.width = width;
    this.damage = damage;
    this.color = color;
    this.lifetime = 0.8;
    this.age = 0;
    this.rotation = angle;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  public getOwnerId(): number {
    return this.ownerId;
  }

  public getDamage(): number {
    return this.damage;
  }

  public getEndX(): number {
    return this.x + Math.cos(this.rotation) * this.length;
  }

  public getEndY(): number {
    return this.y + Math.sin(this.rotation) * this.length;
  }

  public getLength(): number {
    return this.length;
  }

  public update(dt: number): void {
    if (!this.alive) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;
    if (this.age >= this.lifetime) {
      this.alive = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const alpha = 1 - this.age / this.lifetime;
    const endX = this.x + Math.cos(this.rotation) * this.length;
    const endY = this.y + Math.sin(this.rotation) * this.length;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = this.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = this.width * 0.4;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }
}
