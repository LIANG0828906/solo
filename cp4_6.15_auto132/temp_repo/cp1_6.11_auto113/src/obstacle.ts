export type ObstacleType = 'platform' | 'spike' | 'boost' | 'checkpoint' | 'finish';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Obstacle implements Rect {
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public type: ObstacleType;
  public active: boolean;
  public spikeDir: 'up' | 'right' | 'left';
  public animation: number;
  public boostFlowOffset: number;
  public checkpointPulse: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.type = 'platform';
    this.active = false;
    this.spikeDir = 'up';
    this.animation = 0;
    this.boostFlowOffset = 0;
    this.checkpointPulse = 0;
  }

  public init(
    x: number,
    y: number,
    w: number,
    h: number,
    type: ObstacleType,
    spikeDir: 'up' | 'right' | 'left' = 'up'
  ): void {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.active = true;
    this.spikeDir = spikeDir;
    this.animation = Math.random() * Math.PI * 2;
    this.boostFlowOffset = 0;
    this.checkpointPulse = 0;
  }

  public reset(): void {
    this.active = false;
  }

  public update(dt: number, highDetail: boolean): void {
    if (!this.active) return;
    this.animation += dt;
    if (highDetail) {
      if (this.type === 'boost') {
        this.boostFlowOffset = (this.boostFlowOffset + 2) % 16;
      }
      if (this.type === 'checkpoint') {
        this.checkpointPulse += dt * 3;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, highDetail: boolean): void {
    if (!this.active) return;
    const sx = this.x - cameraX;

    switch (this.type) {
      case 'platform':
        this.drawPlatform(ctx, sx);
        break;
      case 'spike':
        this.drawSpike(ctx, sx, highDetail);
        break;
      case 'boost':
        this.drawBoost(ctx, sx);
        break;
      case 'checkpoint':
        this.drawCheckpoint(ctx, sx);
        break;
      case 'finish':
        this.drawFinish(ctx, sx);
        break;
    }
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, sx: number): void {
    const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    grad.addColorStop(0, '#66BB6A');
    grad.addColorStop(1, '#2E7D32');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, this.y, this.w, this.h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(sx, this.y + this.h - 4, this.w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(sx, this.y, this.w, 3);
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, this.y + 0.5, this.w - 1, this.h - 1);
  }

  private drawSpike(ctx: CanvasRenderingContext2D, sx: number, highDetail: boolean): void {
    let flash = 1;
    if (highDetail) {
      flash = 0.7 + 0.3 * Math.sin(this.animation * 4);
    }
    const r = Math.floor(255 * flash);
    const g = Math.floor(50 * flash);
    const b = Math.floor(50 * flash);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 1;

    const count = Math.max(1, Math.floor(this.w / 12));
    const sw = this.w / count;

    for (let i = 0; i < count; i++) {
      const bx = sx + i * sw;
      ctx.beginPath();
      if (this.spikeDir === 'up') {
        ctx.moveTo(bx, this.y + this.h);
        ctx.lineTo(bx + sw / 2, this.y);
        ctx.lineTo(bx + sw, this.y + this.h);
      } else if (this.spikeDir === 'right') {
        ctx.moveTo(bx, this.y);
        ctx.lineTo(bx + sw, this.y + this.h / 2);
        ctx.lineTo(bx, this.y + this.h);
      } else {
        ctx.moveTo(bx + sw, this.y);
        ctx.lineTo(bx, this.y + this.h / 2);
        ctx.lineTo(bx + sw, this.y + this.h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawBoost(ctx: CanvasRenderingContext2D, sx: number): void {
    const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    grad.addColorStop(0, '#FFEB3B');
    grad.addColorStop(1, '#FFC107');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, this.y, this.w, this.h);

    ctx.fillStyle = '#FFD600';
    const stripeW = 16;
    for (let i = -1; i < Math.ceil(this.w / stripeW) + 1; i++) {
      const x = sx + i * stripeW + this.boostFlowOffset;
      ctx.beginPath();
      ctx.moveTo(x, this.y);
      ctx.lineTo(x + stripeW / 2, this.y);
      ctx.lineTo(x - stripeW / 2, this.y + this.h);
      ctx.lineTo(x - stripeW, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(sx, this.y, this.w, 2);
    ctx.strokeStyle = '#FF8F00';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, this.y + 0.5, this.w - 1, this.h - 1);
  }

  private drawCheckpoint(ctx: CanvasRenderingContext2D, sx: number): void {
    const pulse = 0.5 + 0.5 * Math.sin(this.checkpointPulse);
    const alpha = 0.25 + 0.35 * pulse;

    const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
    grad.addColorStop(0, `rgba(0,229,255,${alpha + 0.2})`);
    grad.addColorStop(0.5, `rgba(0,229,255,${alpha})`);
    grad.addColorStop(1, `rgba(0,229,255,${alpha - 0.1 > 0 ? alpha - 0.1 : 0})`);
    ctx.fillStyle = grad;
    ctx.fillRect(sx + this.w * 0.3, this.y, this.w * 0.4, this.h);

    ctx.strokeStyle = `rgba(0,229,255,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + this.w / 2, this.y);
    ctx.lineTo(sx + this.w / 2, this.y + this.h);
    ctx.stroke();

    ctx.fillStyle = '#00B8D4';
    ctx.fillRect(sx + this.w * 0.2, this.y + this.h - 10, this.w * 0.6, 10);
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(sx + this.w * 0.2, this.y + this.h - 10, this.w * 0.6, 3);
  }

  private drawFinish(ctx: CanvasRenderingContext2D, sx: number): void {
    const archW = this.w;
    const archH = this.h;
    const thickness = 18;

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.moveTo(sx, archH);
    ctx.lineTo(sx, archH * 0.45);
    ctx.quadraticCurveTo(sx + archW / 2, -archH * 0.1, sx + archW, archH * 0.45);
    ctx.lineTo(sx + archW, archH);
    ctx.lineTo(sx + archW - thickness, archH);
    ctx.lineTo(sx + archW - thickness, archH * 0.45);
    ctx.quadraticCurveTo(sx + archW / 2, archH * 0.08, sx + thickness, archH * 0.45);
    ctx.lineTo(sx + thickness, archH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.moveTo(sx, archH);
    ctx.lineTo(sx, archH * 0.45);
    ctx.quadraticCurveTo(sx + archW / 2, -archH * 0.1, sx + archW, archH * 0.45);
    ctx.lineTo(sx + archW - 4, archH * 0.45);
    ctx.quadraticCurveTo(sx + archW / 2, -archH * 0.03, sx + 4, archH * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sx + archW / 2, archH * 0.18, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B6914';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', sx + archW / 2, archH * 0.18);

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(sx + archW * 0.25, archH * 0.45, archW * 0.5, 5);
  }

  public getAABB(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  public getSpikeHitbox(): Rect {
    if (this.type !== 'spike') return this.getAABB();
    const margin = 3;
    if (this.spikeDir === 'up') {
      return { x: this.x + margin, y: this.y + margin, w: this.w - margin * 2, h: this.h - margin };
    } else if (this.spikeDir === 'right') {
      return { x: this.x + margin, y: this.y + margin, w: this.w - margin, h: this.h - margin * 2 };
    } else {
      return { x: this.x, y: this.y + margin, w: this.w - margin, h: this.h - margin * 2 };
    }
  }
}

export class ObstaclePool {
  private pool: Obstacle[];
  private maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
    this.pool = [];
    for (let i = 0; i < maxSize; i++) {
      this.pool.push(new Obstacle());
    }
  }

  public acquire(
    x: number,
    y: number,
    w: number,
    h: number,
    type: ObstacleType,
    spikeDir: 'up' | 'right' | 'left' = 'up'
  ): Obstacle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].init(x, y, w, h, type, spikeDir);
        return this.pool[i];
      }
    }
    if (this.pool.length < this.maxSize) {
      const obj = new Obstacle();
      obj.init(x, y, w, h, type, spikeDir);
      this.pool.push(obj);
      return obj;
    }
    return null;
  }

  public releaseAll(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].reset();
    }
  }

  public getActive(): Obstacle[] {
    return this.pool.filter(o => o.active);
  }

  public getPool(): Obstacle[] {
    return this.pool;
  }
}

export function aabbIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export class LevelGenerator {
  private levelLength: number;
  private canvasHeight: number;

  constructor(levelLength: number = 3000, canvasHeight: number = 500) {
    this.levelLength = levelLength;
    this.canvasHeight = canvasHeight;
  }

  public generate(pool: ObstaclePool): {
    checkpoints: { x: number; y: number; w: number; h: number }[];
    startX: number;
    startY: number;
    finishX: number;
  } {
    pool.releaseAll();
    const checkpoints: { x: number; y: number; w: number; h: number }[] = [];
    const groundY = this.canvasHeight - 60;

    const startPlatW = 200;
    const startX = 40;
    const startY = groundY - 40;
    pool.acquire(startX - 40, groundY, startPlatW + 40, 60, 'platform');

    let curX = startX + startPlatW;
    let curY = groundY - 40;

    while (curX < this.levelLength - 300) {
      const gap = 40 + Math.floor(Math.random() * 80);
      curX += gap;

      const waveOffset = Math.sin(curX * 0.004) * 80 + Math.sin(curX * 0.011) * 35;
      const targetY = groundY - 80 + waveOffset;
      curY += (targetY - curY) * 0.35;
      curY = Math.max(120, Math.min(groundY - 60, curY));

      const platW = 60 + Math.floor(Math.random() * 61);
      const platH = 16;
      pool.acquire(curX, curY, platW, platH, 'platform');

      const r = Math.random();
      if (r < 0.35 && platW >= 70) {
        const spikeCount = 1 + Math.floor(Math.random() * 2);
        const spikeW = 12 * spikeCount;
        const spikeX = curX + Math.floor(Math.random() * (platW - spikeW - 10)) + 5;
        pool.acquire(spikeX, curY - 14, spikeW, 14, 'spike', 'up');
      } else if (r >= 0.35 && r < 0.55 && platW >= 80) {
        const boostW = 30 + Math.floor(Math.random() * 20);
        const boostX = curX + Math.floor((platW - boostW) / 2);
        pool.acquire(boostX, curY - 6, boostW, 6, 'boost');
      } else if (r >= 0.55 && r < 0.65) {
        const floatPlatY = curY - 70 - Math.floor(Math.random() * 50);
        const floatPlatW = 50 + Math.floor(Math.random() * 40);
        pool.acquire(curX + platW * 0.2, floatPlatY, floatPlatW, 14, 'platform');
      }

      if (Math.random() < 0.2 && platW >= 70) {
        const cpW = 40;
        const cpX = curX + Math.floor((platW - cpW) / 2);
        const cpY = curY - 120;
        const cp = { x: cpX, y: cpY, w: cpW, h: 120 };
        checkpoints.push(cp);
        pool.acquire(cpX, cpY, cpW, 120, 'checkpoint');
      }

      curX += platW;
    }

    let lastCPX = 0;
    for (let gx = 400; gx < this.levelLength - 200; gx += 400) {
      let foundNear = false;
      for (const cp of checkpoints) {
        if (Math.abs(cp.x - gx) < 250) { foundNear = true; break; }
      }
      if (!foundNear && gx > lastCPX + 200) {
        const forcedPlatY = groundY - 80 + Math.sin(gx * 0.005) * 70;
        const pw = 100;
        pool.acquire(gx, forcedPlatY, pw, 16, 'platform');
        const cpW = 40;
        const cpX = gx + Math.floor((pw - cpW) / 2);
        const cpY = forcedPlatY - 120;
        const cp = { x: cpX, y: cpY, w: cpW, h: 120 };
        checkpoints.push(cp);
        pool.acquire(cpX, cpY, cpW, 120, 'checkpoint');
        lastCPX = gx;
        curX = Math.max(curX, gx + pw);
      }
    }

    const finishX = this.levelLength - 180;
    const finishPlatY = groundY - 40;
    pool.acquire(finishX - 20, finishPlatY, 260, 16, 'platform');
    const archW = 120;
    const archH = 180;
    pool.acquire(finishX, finishPlatY - archH + 16, archW, archH, 'finish');

    for (let cx = 800; cx < this.levelLength; cx += 400) {
      let found = false;
      for (const cp of checkpoints) {
        if (Math.abs(cp.x - cx) < 100) { found = true; break; }
      }
      if (!found) {
        const cpW = 40;
        const cpX = cx;
        const cpY = 100;
        const cp = { x: cpX, y: cpY, w: cpW, h: 300 };
        checkpoints.push(cp);
        pool.acquire(cpX, cpY, cpW, 300, 'checkpoint');
      }
    }

    checkpoints.sort((a, b) => a.x - b.x);

    return { checkpoints, startX: startX + 60, startY: groundY - 100, finishX };
  }
}
