import type { Particle, ParticleType } from './types';

const MAX_PARTICLES = 200;

export class ParticleSystem {
  private particles: Particle[] = [];

  public emitCoinBurst(x: number, y: number): void {
    const count = 25;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 2.5;
      const colors = ['#ffd700', '#ffec8b', '#ffefd5', '#fffacd'];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0,
        maxLife: 60 + Math.random() * 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
        type: 'coin',
        gravity: 0.08
      } as Particle & { gravity: number });
    }
  }

  public emitFire(x: number, y: number): void {
    const count = 30;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 1 + Math.random() * 3;
      const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 35 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3,
        type: 'fire'
      });
    }
  }

  public emitPortal(x: number, y: number): void {
    const count = 40;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = (Math.PI * 2 * i) / count;
      const radius = 5 + Math.random() * 15;
      const colors = ['#6644ff', '#8866ff', '#aa88ff', '#ccbbff', '#4422cc'];
      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 50 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
        type: 'portal',
        angle,
        angularVel: 0.1 + Math.random() * 0.1,
        centerX: x,
        centerY: y,
        radius
      } as Particle & { centerX: number; centerY: number; radius: number });
    }
  }

  public emitSwamp(x: number, y: number): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.8;
      const colors = ['#44aa44', '#66cc66', '#88dd88', '#338833'];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 45 + Math.random() * 25,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.5 + Math.random() * 2.5,
        type: 'swamp'
      });
    }
  }

  public update(): void {
    const now = performance.now();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      if (p.type === 'coin') {
        const coinP = p as Particle & { gravity: number };
        p.vy += coinP.gravity;
      }

      if (p.type === 'portal') {
        const portalP = p as Particle & { centerX: number; centerY: number; radius: number; angularVel: number; angle: number };
        portalP.angle += portalP.angularVel;
        const shrinkFactor = 1 - p.life / p.maxLife;
        const r = portalP.radius * shrinkFactor;
        p.x = portalP.centerX + Math.cos(portalP.angle) * r;
        p.y = portalP.centerY + Math.sin(portalP.angle) * r;
      } else if (p.type !== 'swamp') {
        p.x += p.vx;
        p.y += p.vy;
      } else {
        p.x += p.vx * (1 - p.life / p.maxLife);
        p.y += p.vy * (1 - p.life / p.maxLife);
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, alpha);

      if (p.type === 'fire' || p.type === 'coin') {
        const gradient = ctx.createRadialGradient(
          p.x + offsetX, p.y + offsetY, 0,
          p.x + offsetX, p.y + offsetY, p.size * 1.5
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x + offsetX, p.y + offsetY, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'portal') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.8;
        ctx.beginPath();
        ctx.arc(p.x + offsetX, p.y + offsetY, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'swamp') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x + offsetX, p.y + offsetY, p.size * 2 * (p.life / p.maxLife + 0.2), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  public clear(): void {
    this.particles.length = 0;
  }

  public getActiveCount(): number {
    return this.particles.length;
  }
}
