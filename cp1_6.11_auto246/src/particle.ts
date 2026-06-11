export type ParticleType = 'sawtooth' | 'smoke' | 'crack' | 'shine';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
  size: number;
  color: string;
  type: ParticleType;
  rot: number;
  vr: number;
}

export class ParticlePool {
  private pool: Particle[] = [];
  private maxSize: number;

  constructor(maxSize: number = 600) {
    this.maxSize = maxSize;
    for (let i = 0; i < maxSize; i++) {
      this.pool.push(this.createEmpty());
    }
  }

  private createEmpty(): Particle {
    return {
      active: false,
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, alpha: 0,
      size: 0, color: '#000', type: 'smoke',
      rot: 0, vr: 0
    };
  }

  emit(type: ParticleType, x: number, y: number, count: number, opts: Partial<Particle> = {}): void {
    let emitted = 0;
    for (let i = 0; i < this.pool.length && emitted < count; i++) {
      const p = this.pool[i];
      if (!p.active) {
        this.initParticle(p, type, x, y, opts);
        p.active = true;
        emitted++;
      }
    }
  }

  private initParticle(p: Particle, type: ParticleType, x: number, y: number, opts: Partial<Particle>): void {
    p.type = type;
    p.x = x;
    p.y = y;
    p.rot = 0;
    p.vr = 0;

    switch (type) {
      case 'sawtooth': {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 0.5;
        p.life = 0;
        p.maxLife = 600 + Math.random() * 200;
        p.alpha = 1;
        p.size = 3;
        p.color = opts.color || '#8B4513';
        p.vr = (Math.random() - 0.5) * 0.2;
        break;
      }
      case 'smoke': {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.8;
        p.vx = Math.cos(angle) * speed;
        p.vy = -0.3 - Math.random() * 1.2;
        p.life = 0;
        p.maxLife = 1000 + Math.random() * 600;
        p.alpha = 0.5 + Math.random() * 0.5;
        p.size = 2 + Math.random() * 2;
        p.color = opts.color || '#D5D5D5';
        break;
      }
      case 'crack': {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 1500;
        p.alpha = 0.9;
        p.size = 1 + Math.random() * 1.5;
        p.color = opts.color || '#FFFFFF';
        break;
      }
      case 'shine': {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.1 + Math.random() * 0.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 300;
        p.alpha = 1;
        p.size = 2 + Math.random() * 3;
        p.color = opts.color || '#FFFFFF';
        break;
      }
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      const t = p.life / p.maxLife;
      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);
      p.rot += p.vr * (dt / 16.67);

      switch (p.type) {
        case 'sawtooth':
          p.vy += 0.05 * (dt / 16.67);
          p.alpha = 1 - t;
          break;
        case 'smoke':
          p.vy -= 0.01 * (dt / 16.67);
          p.size += 0.015 * (dt / 16.67);
          p.alpha = (0.5 + Math.sin(t * Math.PI) * 0.5) * (1 - t * 0.8);
          break;
        case 'crack':
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.alpha = 0.9 * (1 - t * 0.6);
          break;
        case 'shine':
          p.alpha = (1 - t) * Math.sin(t * Math.PI);
          break;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.translate(p.x, p.y);

      switch (p.type) {
        case 'sawtooth': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const s = p.size;
          ctx.moveTo(-s, -s);
          ctx.lineTo(s, 0);
          ctx.lineTo(-s, s);
          ctx.lineTo(-s * 0.5, 0);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'smoke': {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'crack': {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          const len = 8 + Math.random() * 12;
          const dx = Math.cos(Math.atan2(p.vy, p.vx)) * len;
          const dy = Math.sin(Math.atan2(p.vy, p.vx)) * len;
          ctx.moveTo(0, 0);
          ctx.lineTo(dx * 0.3, dy * 0.3 + (Math.random() - 0.5) * 3);
          ctx.lineTo(dx * 0.6, dy * 0.6 + (Math.random() - 0.5) * 4);
          ctx.lineTo(dx, dy);
          ctx.stroke();
          break;
        }
        case 'shine': {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    }
  }

  clear(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }
}
