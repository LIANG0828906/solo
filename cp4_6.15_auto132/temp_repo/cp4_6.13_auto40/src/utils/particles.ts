interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
}

const GOLD_COLORS = ['#D4AF37', '#FFD700', '#FFC125', '#EEC900', '#CD950C', '#FFB90F'];

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private onComplete: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private resize = (): void => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  private createParticle(x: number, y: number): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 6 + 2,
      color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
      gravity: 0.15,
    };
  }

  explode(x: number, y: number, count: number = 100): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(x, y));
    }
    if (!this.animationId) {
      this.animate();
    }
  }

  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    let allDead = true;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      } else {
        allDead = false;
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
    
    if (allDead) {
      this.animationId = null;
      if (this.onComplete) {
        this.onComplete();
        this.onComplete = null;
      }
    } else {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
