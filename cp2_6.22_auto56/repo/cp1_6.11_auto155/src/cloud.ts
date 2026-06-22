export class Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  darkened: boolean = false;
  darknessTimer: number = 0;

  private ellipses: { ox: number; oy: number; rx: number; ry: number }[] = [];

  constructor(canvasWidth: number, canvasHeight: number) {
    this.width = 80 + Math.random() * 70;
    this.height = 40 + Math.random() * 30;
    this.x = canvasWidth + this.width;
    this.y = Math.random() * (canvasHeight * 0.6);
    this.speed = 15 + Math.random() * 15;
    this.opacity = 0.4 + Math.random() * 0.3;
    this.generateEllipses();
  }

  private generateEllipses(): void {
    this.ellipses = [];
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.ellipses.push({
        ox: (Math.random() - 0.5) * this.width * 0.6,
        oy: (Math.random() - 0.5) * this.height * 0.4,
        rx: this.width * (0.3 + Math.random() * 0.25),
        ry: this.height * (0.3 + Math.random() * 0.2),
      });
    }
  }

  update(dt: number): void {
    this.x -= this.speed * dt;
    if (this.darkened) {
      this.darknessTimer -= dt;
      if (this.darknessTimer <= 0) {
        this.darkened = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const baseOpacity = this.darkened ? this.opacity * 0.4 : this.opacity;
    for (const e of this.ellipses) {
      const gradient = ctx.createRadialGradient(
        this.x + e.ox, this.y + e.oy, 0,
        this.x + e.ox, this.y + e.oy, e.rx
      );
      if (this.darkened) {
        gradient.addColorStop(0, `rgba(74,74,74,${baseOpacity})`);
        gradient.addColorStop(1, `rgba(60,60,60,${baseOpacity * 0.5})`);
      } else {
        gradient.addColorStop(0, `rgba(255,255,255,${baseOpacity})`);
        gradient.addColorStop(1, `rgba(192,192,192,${baseOpacity * 0.5})`);
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(this.x + e.ox, this.y + e.oy, e.rx, e.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  isOffScreen(): boolean {
    return this.x + this.width < -50;
  }

  darken(duration: number): void {
    this.darkened = true;
    this.darknessTimer = duration;
  }
}

export interface LightningBolt {
  x: number;
  segments: { x: number; y: number }[];
  life: number;
  maxLife: number;
  branchLevel: number;
}

export class LightningSystem {
  bolts: LightningBolt[] = [];
  flashAlpha: number = 0;
  stormActive: boolean = false;
  stormTimer: number = 0;
  nextStormTime: number = 10 + Math.random() * 5;
  cloudsDarkened: boolean = false;

  private canvasWidth: number;
  private canvasHeight: number;
  private onPlayerHit: (() => void) | null = null;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  setPlayerHitCallback(cb: () => void): void {
    this.onPlayerHit = cb;
  }

  update(dt: number, playerX: number, playerY: number, playerW: number, playerH: number): void {
    this.nextStormTime -= dt;
    if (this.nextStormTime <= 0 && !this.stormActive) {
      this.triggerStorm(playerX, playerY, playerW, playerH);
      this.nextStormTime = 10 + Math.random() * 5;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 10;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }

    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) {
        this.bolts.splice(i, 1);
      }
    }

    if (this.stormActive) {
      this.stormTimer -= dt;
      if (this.stormTimer <= 0) {
        this.stormActive = false;
        this.cloudsDarkened = false;
      }
    }
  }

  triggerStorm(playerX: number, playerY: number, playerW: number, playerH: number): void {
    this.stormActive = true;
    this.stormTimer = 3;
    this.flashAlpha = 1.0;
    this.cloudsDarkened = true;

    const boltCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < boltCount; i++) {
      const startX = 100 + Math.random() * (this.canvasWidth - 200);
      const length = 200 + Math.random() * 200;
      this.createBolt(startX, 0, length, 0, playerX, playerY, playerW, playerH);
    }
  }

  private createBolt(
    startX: number, startY: number, length: number, branchLevel: number,
    playerX: number, playerY: number, playerW: number, playerH: number
  ): void {
    const segments: { x: number; y: number }[] = [];
    let cx = startX;
    let cy = startY;
    const segCount = 8 + Math.floor(Math.random() * 6);
    const segLen = length / segCount;

    segments.push({ x: cx, y: cy });

    for (let i = 0; i < segCount; i++) {
      cx += (Math.random() - 0.5) * 40;
      cy += segLen;
      segments.push({ x: cx, y: cy });

      if (branchLevel < 2 && Math.random() < 0.3) {
        const branchLen = length * (0.3 + Math.random() * 0.3);
        this.createBranchBolt(cx, cy, branchLen, branchLevel + 1);
      }
    }

    this.bolts.push({
      x: startX,
      segments,
      life: 0.3,
      maxLife: 0.3,
      branchLevel,
    });

    if (this.checkPlayerHit(segments, playerX, playerY, playerW, playerH)) {
      if (this.onPlayerHit) {
        this.onPlayerHit();
      }
    }
  }

  private createBranchBolt(startX: number, startY: number, length: number, branchLevel: number): void {
    const segments: { x: number; y: number }[] = [];
    let cx = startX;
    let cy = startY;
    const segCount = 3 + Math.floor(Math.random() * 4);
    const segLen = length / segCount;

    segments.push({ x: cx, y: cy });

    const direction = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < segCount; i++) {
      cx += direction * (10 + Math.random() * 20);
      cy += segLen * 0.7;
      segments.push({ x: cx, y: cy });
    }

    this.bolts.push({
      x: startX,
      segments,
      life: 0.3,
      maxLife: 0.3,
      branchLevel,
    });
  }

  private checkPlayerHit(
    segments: { x: number; y: number }[],
    px: number, py: number, pw: number, ph: number
  ): boolean {
    const hitMargin = 20;
    for (const seg of segments) {
      if (
        seg.x >= px - hitMargin && seg.x <= px + pw + hitMargin &&
        seg.y >= py - hitMargin && seg.y <= py + ph + hitMargin
      ) {
        return true;
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.restore();
    }

    for (const bolt of this.bolts) {
      const alpha = bolt.life / bolt.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,0,${alpha})`;
      ctx.lineWidth = bolt.branchLevel === 0 ? 3 : bolt.branchLevel === 1 ? 2 : 1;
      ctx.shadowColor = 'rgba(255,255,100,0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < bolt.segments.length; i++) {
        if (i === 0) {
          ctx.moveTo(bolt.segments[i].x, bolt.segments[i].y);
        } else {
          ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
