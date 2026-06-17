export class BlackHole {
  x: number;
  y: number;
  radius: number = 15;
  rotationAngle: number = 0;
  rotationPeriod: number = 4;
  alive: boolean = true;
  numSectors: number = 12;
  consumeRadius: number = 20;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number): void {
    this.rotationAngle += (dt / this.rotationPeriod) * Math.PI * 2;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const diskRadius = this.radius * 2.5;
    for (let i = 0; i < this.numSectors; i++) {
      const startAngle = this.rotationAngle + (i * Math.PI * 2) / this.numSectors;
      const endAngle = startAngle + Math.PI / this.numSectors;

      ctx.fillStyle = 'rgba(139,0,139,0.3)';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(this.x, this.y, diskRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.7, '#1A1A2E');
    grad.addColorStop(1, '#2F2F2F');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(139,0,139,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  isConsuming(ax: number, ay: number): boolean {
    const dx = ax - this.x;
    const dy = ay - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.consumeRadius;
  }
}
