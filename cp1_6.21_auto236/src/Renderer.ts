import type { GameState, Block, Particle, ScorePopup, ComboEffectLevel, Bullet } from './types';

export class Renderer {
  static readonly BEAT_COLORS = ['#FF3366', '#3366FF', '#33FF66', '#9933FF'];
  static readonly CENTER_RADIUS = 30;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private centerX: number;
  private centerY: number;
  private blockTextures: Map<string, HTMLCanvasElement>;
  private crosshairPulse: number;
  private time: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.blockTextures = new Map();
    this.crosshairPulse = 0;
    this.time = 0;
    this.preloadBlockTextures();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
  }

  render(state: GameState): void {
    this.time += 1 / 60;
    this.crosshairPulse = Math.max(0, this.crosshairPulse - (1 / 60) / 0.15);

    const ctx = this.ctx;
    ctx.save();
    this.drawScreenShake(state.screenShake);
    this.drawBackground(state);
    this.drawCenterZone();
    this.drawBlocks(state.blocks);
    this.drawBullets(state.bullets);
    this.drawParticles(state.particles);
    this.drawScorePopups(state.scorePopups);
    this.drawCrosshair(state);
    ctx.restore();
  }

  triggerCrosshairPulse(): void {
    this.crosshairPulse = 1;
  }

  spawnExplosion(x: number, y: number, color: string): Particle[] {
    const particles: Particle[] = [];
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
    return particles;
  }

  spawnScorePopup(x: number, y: number, score: number, multiplier: number): ScorePopup {
    return {
      x,
      y,
      score,
      multiplier,
      life: 1,
      decay: 0.02,
    };
  }

  private preloadBlockTextures(): void {
    const patterns = ['diagonal', 'wave', 'arrow', 'dot'];
    for (let i = 0; i < 4; i++) {
      const color = Renderer.BEAT_COLORS[i];
      const pattern = patterns[i];
      const texture = this.createOffscreenBlock(70, color, pattern);
      this.blockTextures.set(color, texture);
    }
  }

  private createOffscreenBlock(size: number, color: string, pattern: string): HTMLCanvasElement {
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d')!;
    const radius = 10;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;

    if (pattern === 'diagonal') {
      for (let i = -size; i < size * 2; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
      }
    } else if (pattern === 'wave') {
      ctx.beginPath();
      for (let y = 0; y < size; y += 12) {
        for (let x = 0; x <= size; x += 2) {
          const py = y + Math.sin((x / size) * Math.PI * 4) * 3;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
      }
      ctx.stroke();
    } else if (pattern === 'arrow') {
      const cx = size / 2;
      const cy = size / 2;
      for (let r = 8; r < size / 2; r += 10) {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
          const x1 = cx + Math.cos(a) * r;
          const y1 = cy + Math.sin(a) * r;
          const x2 = cx + Math.cos(a + 0.3) * (r + 6);
          const y2 = cy + Math.sin(a + 0.3) * (r + 6);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }
    } else if (pattern === 'dot') {
      for (let y = 8; y < size; y += 12) {
        for (let x = 8; x < size; x += 12) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    return offscreen;
  }

  private drawBackground(state: GameState): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0A0A1A');
    gradient.addColorStop(1, '#1A1A2E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    if (state.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 51, 102, ${state.damageFlash * 0.4})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (state.beatFlash > 0) {
      const color = Renderer.BEAT_COLORS[state.currentBeatPhase];
      ctx.fillStyle = this.hexToRgba(color, state.beatFlash * 0.08);
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private drawCenterZone(): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, Renderer.CENTER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, Renderer.CENTER_RADIUS - 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawBlocks(blocks: Block[]): void {
    const ctx = this.ctx;
    const maxDist = Math.max(this.width, this.height) * 0.6;

    for (const block of blocks) {
      const texture = this.blockTextures.get(block.color);
      if (!texture) continue;

      const distFactor = 1 - Math.min(1, block.distanceFromCenter / maxDist);
      const opacity = 0.3 + distFactor * 0.6;
      const scale = block.size / 70;

      ctx.save();
      ctx.translate(block.x, block.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity;
      ctx.drawImage(texture, -35, -35);
      ctx.restore();
    }
  }

  private drawBullets(bullets: Bullet[]): void {
    const ctx = this.ctx;

    for (const bullet of bullets) {
      if (bullet.trail && bullet.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
        for (let i = 1; i < bullet.trail.length; i++) {
          ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    let currentColor = '';

    for (const particle of particles) {
      if (particle.color !== currentColor) {
        if (currentColor !== '') ctx.fill();
        currentColor = particle.color;
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = particle.life;
        ctx.beginPath();
      }
      ctx.moveTo(particle.x, particle.y);
      ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    }
    if (currentColor !== '') {
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawScorePopups(popups: ScorePopup[]): void {
    const ctx = this.ctx;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const popup of popups) {
      const offsetY = (1 - popup.life) * 40;
      ctx.globalAlpha = popup.life;

      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fillText(`+${popup.score}`, popup.x, popup.y - offsetY);

      if (popup.multiplier > 1) {
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.fillText(`x${popup.multiplier}`, popup.x, popup.y - offsetY + 20);
        ctx.font = 'bold 20px Arial';
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  private drawCrosshair(state: GameState): void {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const pulse = this.crosshairPulse;
    const pulseEased = this.cubicBezier(pulse, 0.25, 0.46, 0.45, 0.94);
    const outerRing = 20 + pulseEased * -6;

    const glowLevel: Record<number, number> = { 0: 0, 1: 0.3, 2: 0.5, 3: 0.7, 4: 1 };
    const glow = glowLevel[state.comboEffectLevel] || 0;

    if (glow > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + glow * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.15})`;
      ctx.fill();
    }

    ctx.strokeStyle = glow > 0 ? '#FFD700' : '#FFFFFF';
    ctx.lineWidth = 2;
    if (glow > 0) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10 + glow * 15;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, outerRing, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - outerRing - 10, cy);
    ctx.lineTo(cx - 12, cy);
    ctx.moveTo(cx + 12, cy);
    ctx.lineTo(cx + outerRing + 10, cy);
    ctx.moveTo(cx, cy - outerRing - 10);
    ctx.lineTo(cx, cy - 12);
    ctx.moveTo(cx, cy + 12);
    ctx.lineTo(cx, cy + outerRing + 10);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  private drawScreenShake(shake: number): void {
    if (shake <= 0) return;
    const ctx = this.ctx;
    const offsetX = (Math.random() - 0.5) * shake * 10;
    const offsetY = (Math.random() - 0.5) * shake * 10;
    ctx.translate(offsetX, offsetY);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    let t2 = t;
    for (let i = 0; i < 8; i++) {
      const x = ((ax * t2 + bx) * t2 + cx) * t2 - t;
      if (Math.abs(x) < 1e-6) break;
      const dx = (3 * ax * t2 + 2 * bx) * t2 + cx;
      if (Math.abs(dx) < 1e-6) break;
      t2 -= x / dx;
    }

    return ((ay * t2 + by) * t2 + cy) * t2;
  }
}
