import { SkillType } from './SkillManager';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface ScreenShake {
  x: number;
  y: number;
  duration: number;
  maxDuration: number;
  intensity: number;
}

const PARTICLE_COLORS = ['#FFEAA7', '#FF6B6B', '#4ECDC4'];

export class EffectRenderer {
  private particles: Particle[] = [];
  private screenShake: ScreenShake = { x: 0, y: 0, duration: 0, maxDuration: 0, intensity: 0 };
  private slowMotionActive: boolean = false;

  spawnParticles(skillType: SkillType, x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 500,
        maxLife: 500,
        size: 2,
      });
    }
  }

  triggerScreenShake(intensity: number = 3, duration: number = 300): void {
    const actualIntensity = this.slowMotionActive ? intensity * 2 : intensity;
    const actualDuration = this.slowMotionActive ? 200 : duration;
    
    this.screenShake = {
      x: 0,
      y: 0,
      intensity: actualIntensity,
      duration: actualDuration,
      maxDuration: actualDuration,
    };
  }

  setSlowMotion(active: boolean): void {
    this.slowMotionActive = active;
  }

  update(deltaTime: number): void {
    const timeScale = this.slowMotionActive ? 0.5 : 1;
    const scaledDelta = deltaTime * timeScale;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= scaledDelta;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      const progress = this.screenShake.duration / this.screenShake.maxDuration;
      const currentIntensity = this.screenShake.intensity * progress;
      
      this.screenShake.x = (Math.random() - 0.5) * 2 * currentIntensity;
      this.screenShake.y = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const shakeX = this.screenShake.x;
    const shakeY = this.screenShake.y;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  getShakeOffset(): { x: number; y: number } {
    return { x: this.screenShake.x, y: this.screenShake.y };
  }

  clear(): void {
    this.particles = [];
    this.screenShake = { x: 0, y: 0, duration: 0, maxDuration: 0, intensity: 0 };
  }
}
