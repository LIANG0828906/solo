import { Particle, ElementType } from '../types';

const ELEMENT_COLORS: Record<ElementType, { primary: string; secondary: string; glow: string }> = {
  fire: { primary: '#FF6B35', secondary: '#E25822', glow: 'rgba(255, 107, 53, 0.6)' },
  ice: { primary: '#87CEEB', secondary: '#00BFFF', glow: 'rgba(0, 191, 255, 0.6)' },
  thunder: { primary: '#FFEB3B', secondary: '#FFD700', glow: 'rgba(255, 215, 0, 0.7)' },
  wind: { primary: '#90EE90', secondary: '#32CD32', glow: 'rgba(50, 205, 50, 0.6)' },
};

export class AnimationRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationStartTime: number = 0;
  private currentElement: ElementType | null = null;
  private targetSide: 'left' | 'right' = 'right';
  private isAnimating: boolean = false;
  private animationFrame: number = 0;
  private onComplete: (() => void) | null = null;
  private width: number = 900;
  private height: number = 500;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  public resize(width?: number, height?: number): void {
    this.width = width || this.canvas.clientWidth;
    this.height = height || this.canvas.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawArenaGrid();
    this.drawRuneCircles();
  }

  private drawArenaGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  private drawRuneCircles(): void {
    const ctx = this.ctx;
    const leftX = this.width * 0.25;
    const rightX = this.width * 0.75;
    const centerY = this.height * 0.35;
    const radius = Math.min(this.width, this.height) * 0.12;
    this.drawRuneCircle(leftX, centerY, radius, 'rgba(255, 100, 100, 0.15)', 'rgba(255, 100, 100, 0.3)');
    this.drawRuneCircle(rightX, centerY, radius, 'rgba(100, 150, 255, 0.15)', 'rgba(100, 150, 255, 0.3)');
  }

  private drawRuneCircle(x: number, y: number, r: number, fill: string, stroke: string): void {
    const ctx = this.ctx;
    const time = Date.now() / 1000;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.2);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  public startSpellAnimation(
    element: ElementType,
    targetSide: 'left' | 'right',
    duration: number,
    onComplete: () => void
  ): void {
    this.currentElement = element;
    this.targetSide = targetSide;
    this.animationStartTime = performance.now();
    this.isAnimating = true;
    this.onComplete = onComplete;
    this.particles = this.generateParticles(element, targetSide, duration);
    this.animate();
  }

  private generateParticles(element: ElementType, targetSide: 'left' | 'right', duration: number): Particle[] {
    const particles: Particle[] = [];
    const targetX = targetSide === 'left' ? this.width * 0.25 : this.width * 0.75;
    const targetY = this.height * 0.35;
    const colors = ELEMENT_COLORS[element];
    const countMap: Record<ElementType, number> = {
      fire: 60,
      ice: 50,
      thunder: 40,
      wind: 55,
    };
    const count = countMap[element];
    for (let i = 0; i < count; i++) {
      particles.push(this.createParticle(element, targetX, targetY, colors, duration));
    }
    return particles;
  }

  private createParticle(
    element: ElementType,
    tx: number,
    ty: number,
    colors: { primary: string; secondary: string },
    duration: number
  ): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    if (element === 'wind') {
      vy = -1 - Math.random() * 2;
    }
    const life = (0.3 + Math.random() * 0.7) * duration;
    return {
      x: tx,
      y: ty,
      vx,
      vy,
      life,
      maxLife: life,
      size: element === 'thunder' ? 2 + Math.random() * 3 : 3 + Math.random() * 5,
      color: Math.random() > 0.5 ? colors.primary : colors.secondary,
      element,
    };
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    const elapsed = performance.now() - this.animationStartTime;
    const totalDuration = this.getTotalDuration(this.currentElement!);
    if (elapsed >= totalDuration) {
      this.isAnimating = false;
      this.particles = [];
      if (this.onComplete) {
        this.onComplete();
        this.onComplete = null;
      }
      return;
    }
    this.updateParticles();
    this.drawBackground();
    this.drawSpellEffect(elapsed / totalDuration);
    this.drawParticles();
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private getTotalDuration(element: ElementType): number {
    const durations: Record<ElementType, number> = {
      fire: 600,
      ice: 800,
      thunder: 1000,
      wind: 500,
    };
    return durations[element];
  }

  private updateParticles(): void {
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 16;
      switch (p.element) {
        case 'fire':
          p.vy -= 0.08;
          p.size *= 0.99;
          break;
        case 'ice':
          p.vy += 0.02;
          p.vx *= 0.99;
          break;
        case 'thunder':
          p.vx += (Math.random() - 0.5) * 2;
          p.vy += (Math.random() - 0.5) * 2;
          break;
        case 'wind':
          const ang = Math.atan2(p.vy, p.vx) + 0.08;
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          p.vx = Math.cos(ang) * spd;
          p.vy = Math.sin(ang) * spd;
          break;
      }
    });
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private drawSpellEffect(progress: number): void {
    if (!this.currentElement) return;
    const ctx = this.ctx;
    const tx = this.targetSide === 'left' ? this.width * 0.25 : this.width * 0.75;
    const ty = this.height * 0.35;
    const colors = ELEMENT_COLORS[this.currentElement];
    ctx.save();
    switch (this.currentElement) {
      case 'fire':
        this.drawFireEffect(tx, ty, progress, colors);
        break;
      case 'ice':
        this.drawIceEffect(tx, ty, progress, colors);
        break;
      case 'thunder':
        this.drawThunderEffect(tx, ty, progress, colors);
        break;
      case 'wind':
        this.drawWindEffect(tx, ty, progress, colors);
        break;
    }
    ctx.restore();
  }

  private drawFireEffect(x: number, y: number, p: number, colors: typeof ELEMENT_COLORS.fire): void {
    const ctx = this.ctx;
    const scale = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
    const radius = 30 + scale * 80;
    for (let i = 3; i >= 0; i--) {
      const r = radius * (1 - i * 0.2);
      const alpha = (0.3 - i * 0.07) * scale;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
      gradient.addColorStop(0.5, `${colors.glow}`);
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawIceEffect(x: number, y: number, p: number, colors: typeof ELEMENT_COLORS.ice): void {
    const ctx = this.ctx;
    const rings = 5;
    for (let i = 0; i < rings; i++) {
      const ringP = (p - i * 0.15) / 0.7;
      if (ringP < 0 || ringP > 1) continue;
      const r = ringP * 100 + 10;
      const alpha = (1 - ringP) * 0.8;
      ctx.strokeStyle = colors.primary.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#87CEEB', `rgba(135, 206, 235, ${alpha})`);
      ctx.lineWidth = 3 * (1 - ringP * 0.5);
      ctx.beginPath();
      const spikes = 8;
      for (let j = 0; j <= spikes; j++) {
        const angle = (Math.PI * 2 * j) / spikes + ringP * 0.5;
        const r2 = r * (0.85 + Math.sin(j * 3 + ringP * 10) * 0.15);
        const px = x + Math.cos(angle) * r2;
        const py = y + Math.sin(angle) * r2;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0, 191, 255, ${alpha})`;
      ctx.stroke();
    }
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
    innerGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * (1 - p)})`);
    innerGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawThunderEffect(x: number, y: number, p: number, colors: typeof ELEMENT_COLORS.thunder): void {
    const ctx = this.ctx;
    const flashAlpha = p < 0.8 ? Math.sin(p * Math.PI * 6) * 0.3 + 0.5 : (1 - p) / 0.2 * 0.5;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 120);
    glow.addColorStop(0, `rgba(255, 255, 200, ${flashAlpha * 0.6})`);
    glow.addColorStop(0.5, `rgba(255, 215, 0, ${flashAlpha * 0.3})`);
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 120, 0, Math.PI * 2);
    ctx.fill();
    if (p < 0.9) {
      const branches = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < branches; b++) {
        this.drawLightningBranch(x, y, p, b);
      }
    }
  }

  private drawLightningBranch(x: number, y: number, p: number, seed: number): void {
    const ctx = this.ctx;
    const baseAngle = (seed * Math.PI * 2) / 5 + Math.random() * 0.5;
    const length = 60 + Math.random() * 60;
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.6 + Math.random() * 0.4})`;
    ctx.lineWidth = 2 + Math.random() * 2;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x;
    let cy = y;
    const segments = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < segments; i++) {
      const t = (i + 1) / segments;
      const progressOffset = p * 0.3;
      const angle = baseAngle + (Math.random() - 0.5) * 1.5;
      const segLen = (length * t) - (length * (i / segments));
      cx += Math.cos(angle) * segLen;
      cy += Math.sin(angle) * segLen - segLen * progressOffset;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawWindEffect(x: number, y: number, p: number, colors: typeof ELEMENT_COLORS.wind): void {
    const ctx = this.ctx;
    const arms = 4;
    const rotation = p * Math.PI * 4;
    for (let i = 0; i < arms; i++) {
      const baseAngle = (i * Math.PI * 2) / arms + rotation;
      const alpha = (1 - p) * 0.8;
      ctx.strokeStyle = `rgba(50, 205, 50, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.02) {
        const r = t * 80;
        const angle = baseAngle + t * Math.PI * 1.5;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    const vortexGradient = ctx.createRadialGradient(x, y, 0, x, y, 70);
    vortexGradient.addColorStop(0, `rgba(150, 255, 150, ${0.3 * (1 - p)})`);
    vortexGradient.addColorStop(1, 'rgba(50, 205, 50, 0)');
    ctx.fillStyle = vortexGradient;
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    this.particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.element === 'thunder') {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
      } else if (p.element === 'fire') {
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.element === 'ice') {
        this.drawDiamond(p.x, p.y, p.size);
      } else {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private drawDiamond(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.7, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.7, y);
    ctx.closePath();
    ctx.fill();
  }

  public renderIdleFrame(): void {
    if (this.isAnimating) return;
    this.drawBackground();
  }

  public getAnimationDuration(element: ElementType): number {
    return this.getTotalDuration(element);
  }
}
