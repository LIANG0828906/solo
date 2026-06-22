export class Enemy {
  x: number;
  y: number;
  baseX: number;
  verticalSpeed: number;
  sineAmplitude = 30;
  sinePeriod = 1.5;
  size = 15;
  active = true;
  exploding = false;
  explosionTimer = 0;
  explosionDuration = 0.2;
  color = '#E53935';
  time = 0;

  constructor(x: number, y: number, verticalSpeed: number) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.verticalSpeed = verticalSpeed;
  }

  update(dt: number): void {
    if (this.exploding) {
      this.explosionTimer += dt;
      if (this.explosionTimer >= this.explosionDuration) {
        this.active = false;
      }
    } else {
      this.time += dt;
      this.y += this.verticalSpeed * dt;
      this.x = this.baseX + Math.sin((this.time * 2 * Math.PI) / this.sinePeriod) * this.sineAmplitude;
    }
    if (this.y > 500) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.exploding) {
      const scale = 1 - this.explosionTimer / this.explosionDuration;
      const alpha = scale;
      this.drawHexagon(ctx, this.x, this.y, this.size * scale, '#FFA726', alpha);
    } else {
      this.drawHexagon(ctx, this.x, this.y, this.size, this.color);
    }
  }

  private drawHexagon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
    alpha = 1,
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = ((i * 60 - 30) * Math.PI) / 180;
      const px = cx + size * Math.cos(angle);
      const py = cy + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
