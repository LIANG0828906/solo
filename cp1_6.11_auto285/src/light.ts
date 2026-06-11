export class Light {
  x: number = 0;
  baseX: number = 0;
  y: number = 0;
  colorTemp: number = 0;
  moveRange: number = 200;
  glowRadius: number = 280;

  constructor(baseX: number, baseY: number) {
    this.baseX = baseX;
    this.x = baseX;
    this.y = baseY;
  }

  setLightPosition(dx: number): void {
    this.x = this.baseX + Math.max(-this.moveRange, Math.min(this.moveRange, dx));
  }

  getShadowOffset(): { x: number; y: number } {
    const dx = this.x - this.baseX;
    return {
      x: -dx * 0.6,
      y: 0,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const topW = 20;
    const botW = 30;
    const lampH = 45;

    ctx.save();
    ctx.translate(this.x, this.y);

    const grd = ctx.createRadialGradient(0, lampH / 2, 5, 0, lampH / 2, this.glowRadius);
    grd.addColorStop(0, 'rgba(255,193,7,0.35)');
    grd.addColorStop(0.3, 'rgba(255,152,0,0.15)');
    grd.addColorStop(0.6, 'rgba(255,87,34,0.06)');
    grd.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(-this.glowRadius, -this.glowRadius + lampH / 2, this.glowRadius * 2, this.glowRadius * 2);

    ctx.beginPath();
    ctx.moveTo(-topW / 2, 0);
    ctx.lineTo(topW / 2, 0);
    ctx.lineTo(botW / 2, lampH);
    ctx.lineTo(-botW / 2, lampH);
    ctx.closePath();
    const bodyGrd = ctx.createLinearGradient(0, 0, 0, lampH);
    bodyGrd.addColorStop(0, '#8D6E63');
    bodyGrd.addColorStop(1, '#5D4037');
    ctx.fillStyle = bodyGrd;
    ctx.fill();
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const rows = 3;
    for (let i = 0; i < rows; i++) {
      const t = (i + 1) / (rows + 1);
      const y2 = t * lampH;
      const w2 = topW / 2 + (botW / 2 - topW / 2) * t;
      ctx.beginPath();
      ctx.moveTo(-w2, y2);
      ctx.lineTo(w2, y2);
      ctx.strokeStyle = 'rgba(255,193,7,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, lampH / 2, 8, 0, Math.PI * 2);
    const flameGrd = ctx.createRadialGradient(0, lampH / 2, 2, 0, lampH / 2, 10);
    flameGrd.addColorStop(0, '#FFC107');
    flameGrd.addColorStop(0.5, '#FF9800');
    flameGrd.addColorStop(1, '#FF5722');
    ctx.fillStyle = flameGrd;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, lampH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF9C4';
    ctx.fill();

    ctx.restore();
  }
}
