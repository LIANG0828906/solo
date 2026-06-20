export class LightManager {
  private angle: number = 45;
  private intensity: number = 60;

  setAngle(angle: number): void {
    this.angle = angle;
  }

  getAngle(): number {
    return this.angle;
  }

  setIntensity(intensity: number): void {
    this.intensity = intensity;
  }

  getIntensity(): number {
    return this.intensity;
  }

  applyLighting(
    r: number, g: number, b: number,
    px: number, py: number,
    canvasWidth: number, canvasHeight: number
  ): [number, number, number] {
    if (this.intensity === 0) return [r, g, b];

    const rad = (this.angle * Math.PI) / 180;
    const lightDx = Math.cos(rad);
    const lightDy = Math.sin(rad);

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const normX = (px - cx) / cx;
    const normY = (py - cy) / cy;

    const dot = normX * lightDx + normY * lightDy;
    const intensityFactor = this.intensity / 100;

    let brightnessMod: number;
    if (dot > 0) {
      brightnessMod = 1.0 + 0.3 * dot * intensityFactor;
    } else {
      brightnessMod = 1.0 - 0.2 * Math.abs(dot) * intensityFactor;
    }

    return [
      Math.min(255, Math.max(0, Math.round(r * brightnessMod))),
      Math.min(255, Math.max(0, Math.round(g * brightnessMod))),
      Math.min(255, Math.max(0, Math.round(b * brightnessMod))),
    ];
  }

  drawLightIndicator(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(45, 45, 63, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const rad = (this.angle * Math.PI) / 180;
    const endX = cx + Math.cos(rad) * (radius - 4);
    const endY = cy + Math.sin(rad) * (radius - 4);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + this.intensity / 200})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    ctx.restore();
  }
}
