export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
  type: 'bubble' | 'text';
  text?: string;
}

export class ParticleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10';
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
    this.resize();
  }

  addBubble(x: number, y: number): void {
    this.particles.push({
      x,
      y,
      vx: Math.random() * 1 - 0.5,
      vy: -(0.5 + Math.random()),
      size: 3 + Math.random() * 3,
      color: '#D35400',
      opacity: 1,
      lifetime: 0,
      maxLifetime: 2,
      type: 'bubble',
    });
  }

  addFloatingText(x: number, y: number, text: string): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -50,
      size: 16,
      color: '#F1C40F',
      opacity: 1,
      lifetime: 0,
      maxLifetime: 1.2,
      type: 'text',
      text,
    });
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += delta;
      const progress = p.lifetime / p.maxLifetime;

      if (p.lifetime >= p.maxLifetime) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'bubble') {
        p.x += p.vx * delta * 60;
        p.y += p.vy * delta * 60;
        p.opacity = 1 - progress;
        p.size += 0.02 * delta * 60;
      } else if (p.type === 'text') {
        p.y += p.vy * delta;
        p.opacity = 1 - progress;
      }
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      if (p.type === 'bubble') {
        this.ctx.globalAlpha = p.opacity;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      } else if (p.type === 'text') {
        this.ctx.globalAlpha = p.opacity;
        this.ctx.font = 'bold 16px serif';
        this.ctx.fillStyle = p.color;
        this.ctx.fillText(p.text ?? '', p.x, p.y);
      }

      this.ctx.globalAlpha = 1;
    }
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.offsetWidth;
      this.canvas.height = parent.offsetHeight;
    }
  }

  dispose(): void {
    this.canvas.remove();
    this.particles.length = 0;
  }
}
