class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  active: boolean;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 0;
    this.color = '#ffffff';
    this.life = 0;
    this.maxLife = 0;
    this.active = false;
  }

  reset(x: number, y: number, vx: number, vy: number, size: number, color: string, life: number): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.active = true;
  }
}

class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[];
  private pool: Particle[];
  private animationId: number | null;
  private poolSize: number;
  private gravity: number;
  private friction: number;

  constructor(canvas: HTMLCanvasElement, poolSize: number = 200) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.particles = [];
    this.pool = [];
    this.animationId = null;
    this.poolSize = poolSize;
    this.gravity = 0.02;
    this.friction = 0.98;
    this.initPool();
    this.start();
  }

  private initPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.pool.push(new Particle());
    }
  }

  private getParticle(): Particle | null {
    for (const particle of this.pool) {
      if (!particle.active) {
        return particle;
      }
    }
    if (this.pool.length < this.poolSize * 2) {
      const newParticle = new Particle();
      this.pool.push(newParticle);
      return newParticle;
    }
    return null;
  }

  emit(x: number, y: number, count: number, color: string = '#ffffff'): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 3 + 1;
      const life = Math.random() * 60 + 40;

      particle.reset(x, y, vx, vy, size, color, life);
      this.particles.push(particle);
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.vy += this.gravity;
      p.vx *= this.friction;
      p.vy *= this.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) {
        p.active = false;
        this.particles.splice(i, 1);
      }
    }
  }

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const p of this.particles) {
      if (!p.active) continue;

      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  clear(): void {
    for (const p of this.particles) {
      p.active = false;
    }
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private animate = (): void => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  start(): void {
    if (this.animationId === null) {
      this.animate();
    }
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}

export { Particle, ParticleSystem };
export default ParticleSystem;
