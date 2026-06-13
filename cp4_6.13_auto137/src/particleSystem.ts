import { random, randomChoice, lerp, easeOutQuad } from './utils';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'circle' | 'star' | 'sparkle';
  rotation: number;
  rotationSpeed: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  shakeOffset: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  createBubbleBurst(x: number, y: number, color: string, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + random(-0.2, 0.2);
      const speed = random(2, 6);
      const type = randomChoice<Particle['type']>(['circle', 'star', 'sparkle']);
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: random(3, 8),
        life: 1,
        maxLife: random(600, 1000),
        type,
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.1, 0.1)
      });
    }
  }

  createComboEffect(x: number, y: number, combo: number): void {
    const colors = ['#ff6b9d', '#ffd93d', '#6bcfff', '#a855f7', '#4ade80'];
    const count = Math.min(combo * 2, 30);
    
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(3, 8);
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: randomChoice(colors),
        size: random(4, 10),
        life: 1,
        maxLife: random(800, 1500),
        type: randomChoice(['star', 'sparkle']),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.15, 0.15)
      });
    }
  }

  createScorePopup(x: number, y: number, score: number, color: string = '#ffffff'): void {
    this.scorePopups.push({
      x,
      y,
      text: `+${score}`,
      color,
      life: 1,
      maxLife: 1200,
      size: 24,
      shakeOffset: 0
    });
  }

  createTrailParticle(x: number, y: number, color: string): void {
    this.particles.push({
      x: x + random(-5, 5),
      y: y + random(-5, 5),
      vx: random(-0.5, 0.5),
      vy: random(0.5, 2),
      color,
      size: random(2, 5),
      life: 1,
      maxLife: random(300, 600),
      type: 'circle',
      rotation: 0,
      rotationSpeed: 0
    });
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.life -= deltaTime / p.maxLife;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i];
      popup.y -= 1.5;
      popup.life -= deltaTime / popup.maxLife;
      popup.shakeOffset = Math.sin(performance.now() * 0.02) * 2;
      
      if (popup.life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  render(): void {
    for (const p of this.particles) {
      const alpha = easeOutQuad(p.life);
      const size = p.size * (0.5 + p.life * 0.5);
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;

      switch (p.type) {
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case 'star':
          this.drawStar(0, 0, 5, size / 2, size / 4);
          break;
        case 'sparkle':
          this.drawSparkle(0, 0, size / 2);
          break;
      }
      
      this.ctx.restore();
    }

    for (const popup of this.scorePopups) {
      const alpha = easeOutQuad(popup.life);
      const scale = 0.8 + easeOutQuad(Math.min(1, (1 - popup.life) * 3)) * 0.4;
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `bold ${popup.size * scale}px 'Segoe UI', sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = popup.color;
      this.ctx.shadowColor = popup.color;
      this.ctx.shadowBlur = 15;
      this.ctx.fillText(popup.text, popup.x + popup.shakeOffset, popup.y);
      this.ctx.restore();
    }
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawSparkle(cx: number, cy: number, size: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
    }
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.ctx.fillStyle;
    this.ctx.stroke();
  }

  clear(): void {
    this.particles = [];
    this.scorePopups = [];
  }
}
