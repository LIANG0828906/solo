export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
  shape: 'circle' | 'ring' | 'spark';
  gravity: number;
  friction: number;
}

export class EffectsSystem {
  particles: Particle[] = [];

  emitFireBurst(x: number, y: number): void {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      const life = 0.4 + Math.random() * 0.6;
      const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc44'];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life,
        maxLife: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
        alpha: 1,
        shape: Math.random() > 0.4 ? 'spark' : 'circle',
        gravity: 80,
        friction: 0.96
      });
    }
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        color: '#ff2200',
        size: 8 + Math.random() * 12,
        alpha: 0.3,
        shape: 'circle',
        gravity: -20,
        friction: 0.98
      });
    }
  }

  emitHealWave(x: number, y: number): void {
    for (let ring = 0; ring < 3; ring++) {
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 / 16) * i + ring * 0.3;
        const speed = 30 + ring * 20;
        const life = 0.6 + ring * 0.2;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          color: ring === 0 ? '#44ff88' : ring === 1 ? '#22cc66' : '#00aa44',
          size: 3 + ring * 1.5,
          alpha: 0.9,
          shape: 'circle',
          gravity: 0,
          friction: 0.94
        });
      }
    }
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 20,
        vy: -20 - Math.random() * 40,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        color: '#88ffaa',
        size: 2 + Math.random() * 2,
        alpha: 0.7,
        shape: 'circle',
        gravity: -30,
        friction: 0.97
      });
    }
  }

  emitShieldAura(x: number, y: number): void {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 / 24) * i;
      const radius = 28;
      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8 - 15,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? '#ffd700' : '#ffee88',
        size: 2.5 + Math.random() * 2,
        alpha: 0.9,
        shape: 'circle',
        gravity: -10,
        friction: 0.95
      });
    }
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 18;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: 0,
        vy: -15 - Math.random() * 15,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        color: '#ffe44d',
        size: 1.5 + Math.random() * 1.5,
        alpha: 0.6,
        shape: 'spark',
        gravity: -20,
        friction: 0.97
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
