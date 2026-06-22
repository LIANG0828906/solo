export class RainSystem {
  private width: number = 0;
  private height: number = 0;
  private raindrops: Array<{
    x: number;
    y: number;
    speed: number;
    sway: number;
    swayOffset: number;
  }> = [];
  private lightningTimer: number = 0;
  private lightningFlash: number = 0;
  private nextLightning: number = 2 + Math.random() * 3;
  private isRaining: boolean = false;
  private maxDrops: number = 500;

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setMaxDrops(count: number): void {
    this.maxDrops = count;
  }

  startRain(): void {
    this.isRaining = true;
    this.raindrops = [];
    for (let i = 0; i < this.maxDrops; i++) {
      this.raindrops.push(this.createDrop(true));
    }
    this.nextLightning = 2 + Math.random() * 3;
    this.lightningTimer = 0;
  }

  stopRain(): void {
    this.isRaining = false;
    this.raindrops = [];
    this.lightningFlash = 0;
  }

  private createDrop(randomY: boolean): {
    x: number;
    y: number;
    speed: number;
    sway: number;
    swayOffset: number;
  } {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -10,
      speed: 3 + Math.random() * 2,
      sway: (Math.random() - 0.5) * 0.8,
      swayOffset: Math.random() * Math.PI * 2,
    };
  }

  update(dt: number): void {
    if (!this.isRaining) return;

    for (let i = 0; i < this.raindrops.length; i++) {
      const drop = this.raindrops[i];
      drop.y += drop.speed;
      drop.x += drop.sway + Math.sin(drop.swayOffset + drop.y * 0.02) * 0.3;
      if (drop.y > this.height) {
        this.raindrops[i] = this.createDrop(false);
      }
    }

    this.lightningTimer += dt;
    if (this.lightningFlash > 0) {
      this.lightningFlash -= dt;
      if (this.lightningFlash < 0) this.lightningFlash = 0;
    }

    if (this.lightningTimer >= this.nextLightning) {
      this.lightningFlash = 0.08;
      this.lightningTimer = 0;
      this.nextLightning = 2 + Math.random() * 3;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isRaining) return;

    ctx.strokeStyle = 'rgba(168, 216, 234, 0.7)';
    ctx.lineWidth = 1;

    for (const drop of this.raindrops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.sway, drop.y + 6);
      ctx.stroke();
    }

    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash / 0.08 * 0.6})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  reset(): void {
    this.stopRain();
  }

  getIsRaining(): boolean {
    return this.isRaining;
  }
}
