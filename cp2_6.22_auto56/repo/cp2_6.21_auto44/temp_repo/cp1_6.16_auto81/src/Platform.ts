export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  fading: boolean;
  fadeDelay: number;
  fadeTimer: number;
  fadeDuration: number;
  opacity: number;
  active: boolean;
  disappearing: boolean;
  stoodOn: boolean;
}

export class PlatformPool {
  private pool: PlatformData[] = [];

  acquire(): PlatformData {
    if (this.pool.length > 0) {
      const p = this.pool.pop()!;
      return this.reset(p);
    }
    return this.createNew();
  }

  release(platform: PlatformData): void {
    this.pool.push(platform);
  }

  private createNew(): PlatformData {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 10,
      fading: false,
      fadeDelay: 0,
      fadeTimer: 0,
      fadeDuration: 0.5,
      opacity: 1,
      active: true,
      disappearing: false,
      stoodOn: false
    };
  }

  private reset(p: PlatformData): PlatformData {
    p.x = 0;
    p.y = 0;
    p.width = 0;
    p.height = 10;
    p.fading = false;
    p.fadeDelay = 0;
    p.fadeTimer = 0;
    p.fadeDuration = 0.5;
    p.opacity = 1;
    p.active = true;
    p.disappearing = false;
    p.stoodOn = false;
    return p;
  }
}

export class PlatformManager {
  platforms: PlatformData[] = [];
  pool: PlatformPool;
  minGap: number;
  maxGap: number;
  canvasWidth: number;

  constructor(canvasWidth: number) {
    this.canvasWidth = canvasWidth;
    this.pool = new PlatformPool();
    this.minGap = 100;
    this.maxGap = 200;
  }

  setDifficulty(level: number): void {
    if (level >= 1) {
      this.minGap = 150;
      this.maxGap = 250;
    }
  }

  generateInitialPlatforms(startY: number, viewportHeight: number): void {
    let currentY = startY;
    while (currentY > startY - viewportHeight - 300) {
      this.generatePlatform(currentY);
      currentY -= this.randomRange(this.minGap, this.maxGap);
    }
  }

  generatePlatform(y: number): void {
    const platform = this.pool.acquire();
    platform.width = this.randomRange(60, 120);
    platform.height = 10;
    platform.x = this.randomRange(20, this.canvasWidth - 20 - platform.width);
    platform.y = y;
    platform.disappearing = Math.random() < 0.35;
    this.platforms.push(platform);
  }

  update(playerY: number, highestGeneratedY: number, viewportHeight: number): number {
    let newHighest = highestGeneratedY;
    const threshold = playerY - viewportHeight - 200;

    while (newHighest > threshold) {
      newHighest -= this.randomRange(this.minGap, this.maxGap);
      this.generatePlatform(newHighest);
    }

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];

      if (p.stoodOn && !p.fading && p.disappearing) {
        p.fadeDelay += 1 / 60;
        if (p.fadeDelay >= 0.3) {
          p.fading = true;
        }
      }

      if (p.fading) {
        p.fadeTimer += 1 / 60;
        p.opacity = Math.max(0, 1 - p.fadeTimer / p.fadeDuration);
        if (p.opacity <= 0) {
          p.active = false;
        }
      }

      if (p.y > playerY + 300 || !p.active) {
        this.pool.release(p);
        this.platforms.splice(i, 1);
      }
    }

    return newHighest;
  }

  onPlayerStand(platform: PlatformData): void {
    platform.stoodOn = true;
  }

  draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    for (const p of this.platforms) {
      if (!p.active) continue;

      const drawY = p.y - cameraY;
      ctx.save();
      ctx.globalAlpha = p.opacity;

      ctx.fillStyle = '#3e2723';
      ctx.fillRect(p.x, drawY, p.width, p.height);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, drawY, p.width, p.height);

      const highlightGradient = ctx.createLinearGradient(p.x, drawY, p.x, drawY + p.height);
      highlightGradient.addColorStop(0, 'rgba(255, 200, 100, 0.15)');
      highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = highlightGradient;
      ctx.fillRect(p.x, drawY, p.width, p.height);

      ctx.restore();
    }
  }

  checkCollisions(player: { x: number; y: number; vy: number; radius: number; checkPlatformCollision: (px: number, py: number, pw: number, ph: number) => boolean; resetGround: () => void }): PlatformData | null {
    let stoodPlatform: PlatformData | null = null;
    for (const p of this.platforms) {
      if (!p.active || p.opacity < 0.3) continue;
      if (player.checkPlatformCollision(p.x, p.y, p.width, p.height)) {
        this.onPlayerStand(p);
        stoodPlatform = p;
      }
    }
    return stoodPlatform;
  }

  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
