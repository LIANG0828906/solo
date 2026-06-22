export interface ParticleOptions {
  x: number;
  y: number;
  baseHue: number;
  baseSaturation: number;
  baseLightness: number;
  initialSize: number;
  lifespanSeconds: number;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  size: number;
  initialSize: number;
  age: number;
  maxAge: number;
  fadingOut: boolean;
  fadeStartTime: number;

  constructor(options: ParticleOptions) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2.0;
    const radius = Math.random() * 10;

    this.x = options.x + Math.cos(angle) * radius;
    this.y = options.y + Math.sin(angle) * radius;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.hue = options.baseHue + (Math.random() * 30 - 15);
    this.saturation = Math.min(100, Math.max(0, options.baseSaturation + (Math.random() * 20 - 10)));
    this.lightness = Math.min(100, Math.max(0, options.baseLightness + (Math.random() * 10 - 5)));
    this.alpha = 1;

    this.initialSize = options.initialSize;
    this.size = options.initialSize;
    this.age = 0;
    this.maxAge = options.lifespanSeconds * 60;
    this.fadingOut = false;
    this.fadeStartTime = 0;
  }

  update(): boolean {
    this.age++;

    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;

    const progress = this.age / this.maxAge;
    this.hue -= 0.33;
    this.lightness = Math.min(100, this.lightness + 0.017);
    this.alpha = Math.max(0, 1 - progress);

    this.size = Math.max(0.5, this.initialSize * (1 - progress * 0.83));

    if (this.fadingOut) {
      const fadeProgress = (performance.now() - this.fadeStartTime) / 2000;
      this.alpha = Math.max(0, this.alpha * (1 - fadeProgress));
      if (fadeProgress >= 1) {
        return false;
      }
    }

    return this.age < this.maxAge && this.alpha > 0;
  }

  startFade(): void {
    if (!this.fadingOut) {
      this.fadingOut = true;
      this.fadeStartTime = performance.now();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
