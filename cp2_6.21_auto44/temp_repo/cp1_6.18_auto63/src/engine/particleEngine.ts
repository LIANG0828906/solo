import { Particle, PARTICLE_COLORS } from '@/shared/types';

export type EngineState = 'idle' | 'voting' | 'transition' | 'result';

interface TrophyPoint {
  x: number;
  y: number;
}

export class ParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private state: EngineState = 'idle';
  private centerX: number = 0;
  private centerY: number = 0;
  private totalVotes: number = 0;
  private resultStartTime: number = 0;
  private onResultComplete?: () => void;
  private trophyPoints: TrophyPoint[] = [];
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    this.initParticles();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.centerX = rect.width / 2;
    this.centerY = rect.height / 2;
    this.generateTrophyPoints(rect.width, rect.height);
  }

  private generateTrophyPoints(w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const points: TrophyPoint[] = [];
    const scale = Math.min(w, h) / 400;

    const cupTop = cy - 50 * scale;
    const cupBottom = cy + 20 * scale;
    const cupLeft = cx - 60 * scale;
    const cupRight = cx + 60 * scale;

    for (let i = 0; i < 15; i++) {
      const t = i / 14;
      points.push({ x: cupLeft + t * (cupRight - cupLeft), y: cupTop });
    }

    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const leftX = cupLeft - 25 * scale + t * 25 * scale;
      const leftY = cupTop + 20 * scale + Math.sin(t * Math.PI) * 15 * scale;
      points.push({ x: leftX, y: leftY });
    }

    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const rightX = cupRight + t * 25 * scale;
      const rightY = cupTop + 20 * scale + Math.sin(t * Math.PI) * 15 * scale;
      points.push({ x: rightX, y: rightY });
    }

    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      points.push({ x: cupLeft + t * 20 * scale, y: cupTop + t * (cupBottom - cupTop) });
    }

    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      points.push({ x: cupRight - t * 20 * scale, y: cupTop + t * (cupBottom - cupTop) });
    }

    const stemTop = cupBottom;
    const stemBottom = cupBottom + 40 * scale;
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      points.push({ x: cx - 8 * scale + t * 16 * scale, y: stemTop + t * (stemBottom - stemTop) });
    }

    const baseLeft = cx - 50 * scale;
    const baseRight = cx + 50 * scale;
    const baseTop = stemBottom;
    const baseBottom = stemBottom + 15 * scale;
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      points.push({ x: baseLeft + t * (baseRight - baseLeft), y: baseTop });
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      points.push({ x: baseRight, y: baseTop + t * (baseBottom - baseTop) });
    }
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      points.push({ x: baseRight - t * (baseRight - baseLeft), y: baseBottom });
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      points.push({ x: baseLeft, y: baseBottom - t * (baseBottom - baseTop) });
    }

    this.trophyPoints = points;
  }

  private initParticles(): void {
    this.particles = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = Math.min(this.centerX, this.centerY) * 0.4;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];

      this.particles.push({
        x,
        y,
        startX: x,
        startY: y,
        targetX: x,
        targetY: y,
        color,
        size: 3 + Math.random() * 2,
        speed: 0.02 + Math.random() * 0.01,
        progress: 1,
        phase: Math.random() * Math.PI * 2,
        candidateId: '',
      });
    }
  }

  addVoteParticles(color: string, candidateId: string): void {
    const newCount = 5;
    this.totalVotes += 1;
    this.state = 'transition';

    const totalParticleCount = this.particles.length + newCount;
    const patternType = this.totalVotes % 2 === 0 ? 'flower' : 'star';
    const baseRadius = Math.min(this.centerX, this.centerY) * 0.3;

    this.particles.forEach((p, i) => {
      const pos = this.calculatePatternPosition(i, totalParticleCount, baseRadius, patternType);
      p.startX = p.x;
      p.startY = p.y;
      p.targetX = pos.x;
      p.targetY = pos.y;
      p.progress = 0;
      p.speed = 1 / 48;
    });

    for (let i = 0; i < newCount; i++) {
      const idx = this.particles.length;
      const startAngle = Math.random() * Math.PI * 2;
      const startR = Math.min(this.centerX, this.centerY) * 0.8;
      const startX = this.centerX + Math.cos(startAngle) * startR;
      const startY = this.centerY + Math.sin(startAngle) * startR;
      const target = this.calculatePatternPosition(idx, totalParticleCount, baseRadius, patternType);

      this.particles.push({
        x: startX,
        y: startY,
        startX,
        startY,
        targetX: target.x,
        targetY: target.y,
        color,
        size: 3 + Math.random() * 2,
        speed: 1 / 48,
        progress: 0,
        phase: Math.random() * Math.PI * 2,
        candidateId,
      });
    }
  }

  private calculatePatternPosition(
    index: number,
    total: number,
    baseRadius: number,
    pattern: 'flower' | 'star'
  ): { x: number; y: number } {
    const angle = (index / total) * Math.PI * 2;
    let radius = baseRadius;

    if (pattern === 'flower') {
      const petals = 5 + Math.floor(this.totalVotes / 3);
      radius = baseRadius * (1 + 0.3 * Math.sin(petals * angle));
    } else {
      const points = 5 + Math.floor(this.totalVotes / 2);
      const starPhase = (index % points) / points;
      const starMod = Math.floor(index / points) % 2;
      radius = baseRadius * (starMod === 0 ? 1 : 0.45);
      const adjustedAngle = starPhase * Math.PI * 2 + Math.floor(index / points) * 0.1;
      return {
        x: this.centerX + Math.cos(adjustedAngle) * radius,
        y: this.centerY + Math.sin(adjustedAngle) * radius,
      };
    }

    return {
      x: this.centerX + Math.cos(angle) * radius,
      y: this.centerY + Math.sin(angle) * radius,
    };
  }

  startResultAnimation(onComplete?: () => void): void {
    this.state = 'result';
    this.resultStartTime = performance.now();
    this.onResultComplete = onComplete;

    this.particles.forEach((p, i) => {
      p.startX = p.x;
      p.startY = p.y;
      const trophyIdx = i % this.trophyPoints.length;
      const tp = this.trophyPoints[trophyIdx];
      p.targetX = tp.x + (Math.random() - 0.5) * 10;
      p.targetY = tp.y + (Math.random() - 0.5) * 10;
      p.progress = 0;
      p.speed = 1 / 90;
      p.phase = Math.random() * Math.PI * 2;
    });
  }

  reset(): void {
    this.totalVotes = 0;
    this.state = 'idle';
    this.initParticles();
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (): void => {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.update(dt, now);
    this.draw(now);

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, now: number): void {
    let allComplete = true;

    for (const p of this.particles) {
      if (p.progress < 1) {
        p.progress = Math.min(1, p.progress + p.speed);
        allComplete = false;

        const t = this.easeInOutCubic(p.progress);

        if (this.state === 'result') {
          const wave = Math.sin(p.progress * Math.PI * 3 + p.phase) * 60 * (1 - p.progress);
          const perpX = -(p.targetY - p.startY);
          const perpY = p.targetX - p.startX;
          const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;

          p.x = p.startX + (p.targetX - p.startX) * t + (perpX / perpLen) * wave;
          p.y = p.startY + (p.targetY - p.startY) * t + (perpY / perpLen) * wave;
        } else {
          p.x = p.startX + (p.targetX - p.startX) * t;
          p.y = p.startY + (p.targetY - p.startY) * t;
        }
      } else if (this.state === 'voting' || this.state === 'idle') {
        p.phase += dt * 0.002;
        const floatR = 1.5;
        p.x = p.targetX + Math.cos(p.phase) * floatR;
        p.y = p.targetY + Math.sin(p.phase * 1.3) * floatR;
      }
    }

    if (allComplete) {
      if (this.state === 'transition') {
        this.state = 'voting';
      } else if (this.state === 'result' && this.onResultComplete) {
        const callback = this.onResultComplete;
        this.onResultComplete = undefined;
        callback();
      }
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private draw(now: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.ctx.fillStyle = '#0B0E27';
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    this.drawConnections();

    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      gradient.addColorStop(0, p.color + '66');
      gradient.addColorStop(1, p.color + '00');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    if (this.state === 'result') {
      const elapsed = (now - this.resultStartTime) / 1500;
      if (elapsed > 0.7) {
        const alpha = Math.min(1, (elapsed - 0.7) / 0.3);
        this.drawVoteCount(alpha);
      }
    }
  }

  private drawVoteCount(alpha: number): void {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.font = 'bold 36px sans-serif';
    this.ctx.fillStyle = '#FFD93D';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(String(this.totalVotes), this.centerX, this.centerY - 20);

    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText('总票数', this.centerX, this.centerY + 15);
    this.ctx.restore();
  }

  private drawConnections(): void {
    const maxDist = 120;
    const len = this.particles.length;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = this.lerpColor(p1.color, p2.color, 0.5) + Math.floor(opacity * 255).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  getState(): EngineState {
    return this.state;
  }

  getTotalVotes(): number {
    return this.totalVotes;
  }
}
