export class Ball {
  public x: number;
  public y: number;
  public radius: number;
  public vx: number;
  public vy: number;
  public color: string;
  public glowColor: string;
  public glowBlur: number;

  constructor(x: number, y: number, radius: number = 8) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 5;
    this.color = '#ffffff';
    this.glowColor = '#94a3b8';
    this.glowBlur = 6;
  }

  public update(): void {
    this.x += this.vx;
    this.y += this.vy;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = this.glowBlur;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    const angle = (Math.random() - 0.5) * (Math.PI / 3);
    const speed = 5;
    this.vx = Math.sin(angle) * 3;
    this.vy = speed;
    if (this.vx > 3) this.vx = 3;
    if (this.vx < -3) this.vx = -3;
  }

  public setVerticalSpeed(speed: number): void {
    const direction = this.vy >= 0 ? 1 : -1;
    this.vy = speed * direction;
  }

  public getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
}
