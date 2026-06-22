import { Container, Graphics, Particle, Texture, Rectangle } from 'pixi.js';

export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  decay: number;
}

export class ParticleSystem {
  private particles: ParticleData[] = [];
  private container: Container;
  private graphics: Graphics;

  constructor(parent: Container) {
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    parent.addChild(this.container);
  }

  emit(x: number, y: number, count: number, options: Partial<ParticleData>): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (options.vx ?? 1) * (0.5 + Math.random());
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: options.maxLife ?? 30,
        maxLife: options.maxLife ?? 30,
        size: options.size ?? 2 + Math.random() * 2,
        color: options.color ?? 0x00d4ff,
        alpha: 1,
        decay: options.decay ?? 0.02 + Math.random() * 0.02,
      });
    }
  }

  emitExplosion(x: number, y: number, color: number = 0xff4d2a): void {
    this.emit(x, y, 20, {
      vx: 3,
      maxLife: 40,
      size: 3,
      color,
      decay: 0.025,
    });
    this.emit(x, y, 10, {
      vx: 1.5,
      maxLife: 25,
      size: 5,
      color: 0xffaa00,
      decay: 0.04,
    });
  }

  emitEngineTrail(x: number, y: number, color: number, angle: number): void {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 3,
        y: y + (Math.random() - 0.5) * 3,
        vx: Math.cos(angle) * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3,
        vy: Math.sin(angle) * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        size: 1.5 + Math.random() * 1.5,
        color,
        alpha: 0.8,
        decay: 0.05,
      });
    }
  }

  emitRipple(x: number, y: number, color: number = 0x00d4ff): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 20,
        maxLife: 20,
        size: 2,
        color,
        alpha: 0.8,
        decay: 0.04,
      });
    }
  }

  emitAttackBeam(fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(len / 5);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      this.particles.push({
        x: fromX + dx * t + (Math.random() - 0.5) * 4,
        y: fromY + dy * t + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 10 + Math.random() * 5,
        maxLife: 15,
        size: 2 + Math.random() * 2,
        color,
        alpha: 1,
        decay: 0.06,
      });
    }
  }

  update(): void {
    this.graphics.clear();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.size *= 0.98;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.graphics.beginFill(p.color, p.alpha);
      this.graphics.drawCircle(p.x, p.y, p.size);
      this.graphics.endFill();
    }
  }

  destroy(): void {
    this.particles = [];
    this.container.destroy({ children: true });
  }
}
