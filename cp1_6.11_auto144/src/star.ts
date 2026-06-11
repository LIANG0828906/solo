import { random, hexToRgba, lerp } from './utils';

const STAR_COLOR = '#FFFFFF';
const HALO_COLOR = '#E8D5B7';
const ROTATION_SPEED = (Math.PI * 2) / 10;

export class Star {
  public x: number;
  public y: number;
  public radius: number;
  public haloRadius: number;
  public haloAlpha: number;
  public rotation: number;
  public rotationSpeed: number;
  public haloIntensity: number;
  public alpha: number;
  public targetAlpha: number;
  private twinkleOffset: number;
  private twinkleSpeed: number;

  constructor(x: number, y: number, haloIntensity: number = 5) {
    this.x = x;
    this.y = y;
    this.radius = random(3, 8);
    this.haloRadius = this.radius * 1.5;
    this.haloAlpha = random(0.2, 0.4);
    this.rotation = random(0, Math.PI * 2);
    this.rotationSpeed = ROTATION_SPEED * random(0.8, 1.2);
    this.haloIntensity = haloIntensity;
    this.alpha = 1;
    this.targetAlpha = 1;
    this.twinkleOffset = random(0, Math.PI * 2);
    this.twinkleSpeed = random(0.5, 1.5);
  }

  public update(deltaTime: number, time: number): void {
    this.rotation += this.rotationSpeed * deltaTime;
    this.alpha = lerp(this.alpha, this.targetAlpha, deltaTime * 2);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.alpha <= 0) return;

    const intensityFactor = this.haloIntensity / 5;
    const twinkle = 0.85 + 0.15 * Math.sin(this.twinkleOffset + this.rotation * this.twinkleSpeed);
    const currentAlpha = this.alpha * twinkle;

    ctx.save();
    ctx.globalAlpha = currentAlpha;
    ctx.globalCompositeOperation = 'soft-light';

    const haloGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.haloRadius * intensityFactor * 2.5
    );
    haloGradient.addColorStop(0, hexToRgba(HALO_COLOR, this.haloAlpha * intensityFactor));
    haloGradient.addColorStop(0.3, hexToRgba(HALO_COLOR, this.haloAlpha * 0.6 * intensityFactor));
    haloGradient.addColorStop(0.6, hexToRgba(HALO_COLOR, this.haloAlpha * 0.2 * intensityFactor));
    haloGradient.addColorStop(1, hexToRgba(HALO_COLOR, 0));

    ctx.fillStyle = haloGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.haloRadius * intensityFactor * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.globalAlpha = currentAlpha;
    ctx.globalCompositeOperation = 'soft-light';

    const innerGlow = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 1.2
    );
    innerGlow.addColorStop(0, STAR_COLOR);
    innerGlow.addColorStop(0.5, hexToRgba('#F0E6D3', 0.9));
    innerGlow.addColorStop(1, hexToRgba('#E8D5B7', 0.3));

    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.globalAlpha = currentAlpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    coreGradient.addColorStop(0, '#FFFFFF');
    coreGradient.addColorStop(0.6, hexToRgba('#F0E6D3', 0.95));
    coreGradient.addColorStop(1, hexToRgba('#E8D5B7', 0.7));

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public setHaloIntensity(intensity: number): void {
    this.haloIntensity = intensity;
  }

  public fadeOut(): void {
    this.targetAlpha = 0;
  }

  public fadeIn(): void {
    this.targetAlpha = 1;
    this.alpha = 0;
  }
}
