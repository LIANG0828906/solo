interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface BackgroundParticle {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  phase: number;
  speed: number;
}

export class ParticleEngine {
  private width: number = 0;
  private height: number = 0;
  private bgParticles: BackgroundParticle[] = [];
  private explosionParticles: Particle[] = [];
  private shakeTime: number = 0;
  private shakeAmplitude: number = 3;
  private shakeFrequency: number = 50;
  private shakeDuration: number = 0.4;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;
  private explosionActive: boolean = false;
  private worker: Worker | null = null;
  private pendingExplosionData: Float32Array | null = null;

  constructor(width: number, height: number) {
    this.resize(width, height);
    this.initBackgroundParticles();
    this.initWorker();
  }

  private initWorker() {
    const workerCode = `
      self.onmessage = function(e) {
        const { count, cx, cy, baseR, baseG, baseB } = e.data;
        const result = new Float32Array(count * 8);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 80 + Math.random() * 280;
          const idx = i * 8;
          result[idx] = cx;
          result[idx + 1] = cy;
          result[idx + 2] = Math.cos(angle) * speed;
          result[idx + 3] = Math.sin(angle) * speed;
          result[idx + 4] = 4 + Math.random() * 8;
          result[idx + 5] = 2 + Math.random() * 2;
          result[idx + 6] = 0;
          result[idx + 7] = Math.random() * 0.5;
        }
        self.postMessage({ result }, [result.buffer]);
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = (e) => {
      this.pendingExplosionData = e.data.result;
    };
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private initBackgroundParticles() {
    this.bgParticles = [];
    for (let i = 0; i < 150; i++) {
      this.bgParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1 + Math.random() * 2,
        baseAlpha: 0.3 + Math.random() * 0.4,
        alpha: 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: (2 + Math.random() * 2) * (0.8 + Math.random() * 0.4),
      });
    }
  }

  triggerExplosion(color: string, cx: number, cy: number) {
    const count = 800 + Math.floor(Math.random() * 400);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    if (this.worker) {
      this.worker.postMessage({ count, cx, cy, baseR: r, baseG: g, baseB: b });
    }

    this.explosionParticles = [];
    const baseR = r, baseG = g, baseB = b;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 280;
      const life = 2 + Math.random() * 2;
      const colorVariation = 0.7 + Math.random() * 0.6;
      const pr = Math.min(255, Math.round(baseR * colorVariation));
      const pg = Math.min(255, Math.round(baseG * colorVariation));
      const pb = Math.min(255, Math.round(baseB * colorVariation));
      this.explosionParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color: `#${pr.toString(16).padStart(2, '0')}${pg.toString(16).padStart(2, '0')}${pb.toString(16).padStart(2, '0')}`,
        alpha: 1,
        life: life,
        maxLife: life,
      });
    }
    this.shakeTime = this.shakeDuration;
    this.explosionActive = true;
  }

  update(dt: number) {
    for (const p of this.bgParticles) {
      p.phase += dt * p.speed;
      p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.2;
      p.alpha = Math.max(0.3, Math.min(0.7, p.alpha));
    }

    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const p = this.explosionParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.explosionParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - dt * 0.8);
      p.vy *= (1 - dt * 0.8);
      p.vy += 30 * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= (1 - dt * 0.15);
      p.size = Math.max(1, p.size);
    }

    if (this.explosionParticles.length === 0) {
      this.explosionActive = false;
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const t = this.shakeTime * this.shakeFrequency * Math.PI * 2;
      this.shakeOffsetX = Math.sin(t) * this.shakeAmplitude * (this.shakeTime / this.shakeDuration);
      this.shakeOffsetY = Math.cos(t * 1.3) * this.shakeAmplitude * (this.shakeTime / this.shakeDuration);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  renderBackground(ctx: CanvasRenderingContext2D) {
    for (const p of this.bgParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#6A0DAD';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  renderExplosion(ctx: CanvasRenderingContext2D) {
    for (const p of this.explosionParticles) {
      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  getShakeOffset(): { x: number; y: number } {
    return { x: this.shakeOffsetX, y: this.shakeOffsetY };
  }

  isExplosionActive(): boolean {
    return this.explosionActive;
  }

  destroy() {
    this.worker?.terminate();
  }
}
