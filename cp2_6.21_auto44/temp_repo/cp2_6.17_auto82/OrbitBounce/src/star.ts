export class Star {
  x: number;
  y: number;
  baseRadius: number = 30;
  currentRadius: number = 30;
  pulsePhase: number = 0;
  pulsePeriod: number = 2;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number): void {
    this.pulsePhase += dt / this.pulsePeriod;
    if (this.pulsePhase > 1) this.pulsePhase -= 1;
    const t = Math.sin(this.pulsePhase * Math.PI * 2);
    this.currentRadius = this.baseRadius + t * 5;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const r = this.currentRadius;

    const outerGlow = ctx.createRadialGradient(this.x, this.y, r * 0.5, this.x, this.y, r * 4);
    outerGlow.addColorStop(0, 'rgba(255,215,0,0.3)');
    outerGlow.addColorStop(0.5, 'rgba(255,69,0,0.1)');
    outerGlow.addColorStop(1, 'rgba(255,69,0,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 4, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    grad.addColorStop(0, '#FFF8DC');
    grad.addColorStop(0.3, '#FFD700');
    grad.addColorStop(0.7, '#FFA500');
    grad.addColorStop(1, '#FF4500');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255,215,0,0.4)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  isColliding(ax: number, ay: number, ar: number): boolean {
    const dx = ax - this.x;
    const dy = ay - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.currentRadius + ar;
  }
}
