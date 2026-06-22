export class SkyRenderer {
  private width: number = 0;
  private height: number = 0;
  private cloudParticles: Array<{
    x: number;
    y: number;
    radius: number;
    opacity: number;
    speed: number;
  }> = [];
  private skyTransition: number = 0;
  private targetTransition: number = 0;
  private readonly CLOUD_COUNT = 50;

  constructor() {
    this.initClouds();
  }

  private initClouds(): void {
    this.cloudParticles = [];
    for (let i = 0; i < this.CLOUD_COUNT; i++) {
      this.cloudParticles.push({
        x: Math.random() * (this.width || 1920),
        y: Math.random() * ((this.height || 1080) * 0.5),
        radius: 30 + Math.random() * 80,
        opacity: 0.3 + Math.random() * 0.3,
        speed: 0.2 * (0.5 + Math.random()),
      });
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initClouds();
  }

  setRaining(raining: boolean): void {
    this.targetTransition = raining ? 1 : 0;
  }

  update(): void {
    const speed = 0.005;
    if (this.skyTransition < this.targetTransition) {
      this.skyTransition = Math.min(this.skyTransition + speed, this.targetTransition);
    } else if (this.skyTransition > this.targetTransition) {
      this.skyTransition = Math.max(this.skyTransition - speed * 2, this.targetTransition);
    }

    for (const cloud of this.cloudParticles) {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.radius > this.width) {
        cloud.x = -cloud.radius;
        cloud.y = Math.random() * (this.height * 0.5);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const t = this.skyTransition;

    const topR = Math.round(0x2B + (0x1A - 0x2B) * t);
    const topG = Math.round(0x2B + (0x0F - 0x2B) * t);
    const topB = Math.round(0x2B + (0x2E - 0x2B) * t);

    const botR = Math.round(0x6B + (0x1A - 0x6B) * t);
    const botG = Math.round(0x6B + (0x0F - 0x6B) * t);
    const botB = Math.round(0x6B + (0x2E - 0x6B) * t);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, `rgb(${topR},${topG},${topB})`);
    gradient.addColorStop(1, `rgb(${botR},${botG},${botB})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const cloud of this.cloudParticles) {
      const alpha = cloud.opacity * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      const cloudGray = Math.round(100 + t * 30);
      ctx.fillStyle = `rgba(${cloudGray},${cloudGray},${cloudGray + 10},${alpha})`;
      ctx.fill();
    }
  }

  reset(): void {
    this.targetTransition = 0;
  }

  getTransition(): number {
    return this.skyTransition;
  }
}
