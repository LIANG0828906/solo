export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number = 2;
  active: boolean = true;
  color: string = '#FFFFFF';

  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.isOffScreen()) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  isOffScreen(): boolean {
    return this.x < 0 || this.x > 640 || this.y < 0 || this.y > 480;
  }
}
