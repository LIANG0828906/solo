export class Player {
  x: number;
  y: number;
  size: number;
  targetX: number;
  targetY: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.size = 40;
    this.x = canvasWidth * 0.2;
    this.y = canvasHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  setTarget(x: number, y: number): void {
    const halfSize = this.size / 2;
    this.targetX = Math.max(halfSize, Math.min(this.canvasWidth - halfSize, x));
    this.targetY = Math.max(halfSize, Math.min(this.canvasHeight - halfSize, y));
  }

  update(): void {
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    const gradient = ctx.createLinearGradient(-this.size / 2, 0, this.size / 2, 0);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, '#0088ff');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(this.size / 2, 0);
    ctx.lineTo(-this.size / 2, -this.size / 2.5);
    ctx.lineTo(-this.size / 3, 0);
    ctx.lineTo(-this.size / 2, this.size / 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    const flameSize = this.size * 0.3;
    const flameGradient = ctx.createLinearGradient(-this.size / 3, 0, -this.size / 3 - flameSize, 0);
    flameGradient.addColorStop(0, '#ffaa00');
    flameGradient.addColorStop(0.5, '#ff4400');
    flameGradient.addColorStop(1, 'rgba(255, 68, 0, 0)');

    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-this.size / 3, -this.size / 6);
    ctx.lineTo(-this.size / 3 - flameSize - Math.random() * 8, 0);
    ctx.lineTo(-this.size / 3, this.size / 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  getCollisionRadius(): number {
    return this.size * 0.35;
  }

  collidesWith(x: number, y: number, radius: number): boolean {
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.getCollisionRadius() + radius - 5;
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    const ratioX = canvasWidth / this.canvasWidth;
    const ratioY = canvasHeight / this.canvasHeight;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x *= ratioX;
    this.y *= ratioY;
    this.targetX *= ratioX;
    this.targetY *= ratioY;
  }
}
