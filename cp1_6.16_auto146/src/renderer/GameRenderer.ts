import { RuneEngine, RuneNode, LightChain, RuneShape } from '../core/RuneEngine';

const CRACK_PATTERN_CACHE: { canvas: HTMLCanvasElement | null } = { canvas: null };

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: RuneEngine;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private scoreFlashTime = 0;
  private flipProgress = 0;
  private flipActive = false;
  private flipFromColor = '#0B0C10';
  private flipToColor = '#0B0C10';

  constructor(canvas: HTMLCanvasElement, engine: RuneEngine) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.engine = engine;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.engine.setCanvasSize(width, height);
  }

  triggerScoreFlash(): void {
    this.scoreFlashTime = performance.now();
  }

  triggerFlip(fromColor: string, toColor: string): void {
    this.flipActive = true;
    this.flipProgress = 0;
    this.flipFromColor = fromColor;
    this.flipToColor = toColor;
  }

  render(now: number): void {
    const ctx = this.ctx;

    if (this.flipActive) {
      this.flipProgress = Math.min(1, this.flipProgress + 1 / 36);
      this.renderFlipTransition(ctx);
      if (this.flipProgress >= 1) {
        this.flipActive = false;
      }
      return;
    }

    this.clearCanvas(ctx);
    this.drawBackground(ctx);
    this.drawCrackPattern(ctx);
    this.drawRuneNodes(ctx, now);
    this.drawArea(ctx, now);
    this.drawCurrentStroke(ctx);
    this.drawCompletedRune(ctx, now);
    this.drawChains(ctx, now);
    this.drawParticles(ctx);
    this.drawFlashEffects(ctx);
    this.drawTextEffects(ctx);
    this.drawScoreFlash(ctx, now);
  }

  private renderFlipTransition(ctx: CanvasRenderingContext2D): void {
    const p = this.flipProgress;
    const angle = p * Math.PI;
    const cos = Math.cos(angle);
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);

    if (cos >= 0) {
      ctx.scale(cos, 1);
      ctx.fillStyle = this.flipFromColor;
    } else {
      ctx.scale(Math.abs(cos), 1);
      ctx.fillStyle = this.flipToColor;
    }
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawCrackPattern(ctx);
    ctx.restore();
  }

  private clearCanvas(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0B0C10';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) / 1.2
    );
    gradient.addColorStop(0, '#121418');
    gradient.addColorStop(1, '#0B0C10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawCrackPattern(ctx: CanvasRenderingContext2D): void {
    if (!CRACK_PATTERN_CACHE.canvas ||
        CRACK_PATTERN_CACHE.canvas.width !== this.width ||
        CRACK_PATTERN_CACHE.canvas.height !== this.height) {
      this.generateCrackPattern();
    }
    if (CRACK_PATTERN_CACHE.canvas) {
      ctx.drawImage(CRACK_PATTERN_CACHE.canvas, 0, 0);
    }
  }

  private generateCrackPattern(): void {
    const off = document.createElement('canvas');
    off.width = this.width;
    off.height = this.height;
    const octx = off.getContext('2d');
    if (!octx) return;

    octx.strokeStyle = 'rgba(197, 165, 90, 0.08)';
    octx.lineWidth = 1;

    const numCracks = 80;
    for (let i = 0; i < numCracks; i++) {
      let x = Math.random() * this.width;
      let y = Math.random() * this.height;
      octx.beginPath();
      octx.moveTo(x, y);
      const segments = 3 + Math.floor(Math.random() * 6);
      for (let j = 0; j < segments; j++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 20 + Math.random() * 80;
        x += Math.cos(angle) * length;
        y += Math.sin(angle) * length;
        octx.lineTo(x, y);
      }
      octx.stroke();
    }

    for (let i = 0; i < 200; i++) {
      octx.fillStyle = `rgba(197, 165, 90, ${0.02 + Math.random() * 0.04})`;
      octx.beginPath();
      octx.arc(Math.random() * this.width, Math.random() * this.height, 1 + Math.random() * 2, 0, Math.PI * 2);
      octx.fill();
    }

    CRACK_PATTERN_CACHE.canvas = off;
  }

  private drawArea(ctx: CanvasRenderingContext2D, now: number): void {
    const area = this.engine.getDrawArea();
    const pulse = 0.8 + Math.sin(now * 0.002) * 0.2;

    ctx.save();
    const gradient = ctx.createRadialGradient(
      area.x + area.size / 2, area.y + area.size / 2, area.size * 0.3,
      area.x + area.size / 2, area.y + area.size / 2, area.size * 0.7
    );
    gradient.addColorStop(0, 'rgba(20, 25, 35, 0.9)');
    gradient.addColorStop(1, 'rgba(11, 12, 16, 0.95)');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, area.x, area.y, area.size, area.size, 16);
    ctx.fill();

    ctx.strokeStyle = `rgba(197, 165, 90, ${0.3 + pulse * 0.2})`;
    ctx.lineWidth = 2;
    this.roundRect(ctx, area.x, area.y, area.size, area.size, 16);
    ctx.stroke();

    ctx.strokeStyle = `rgba(197, 165, 90, ${0.1 + pulse * 0.1})`;
    ctx.lineWidth = 1;
    this.roundRect(ctx, area.x + 8, area.y + 8, area.size - 16, area.size - 16, 12);
    ctx.stroke();

    this.drawCornerRunes(ctx, area, now);
    ctx.restore();
  }

  private drawCornerRunes(ctx: CanvasRenderingContext2D, area: { x: number; y: number; size: number }, now: number): void {
    const corners = [
      { x: area.x + 30, y: area.y + 30 },
      { x: area.x + area.size - 30, y: area.y + 30 },
      { x: area.x + 30, y: area.y + area.size - 30 },
      { x: area.x + area.size - 30, y: area.y + area.size - 30 }
    ];
    ctx.save();
    const glow = 0.5 + Math.sin(now * 0.003) * 0.3;
    ctx.fillStyle = `rgba(197, 165, 90, ${0.4 + glow * 0.3})`;
    corners.forEach((c, i) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(now * 0.0005 + i);
      this.drawRuneSymbol(ctx, 'hexagon', 12, '#C5A55A');
      ctx.restore();
    });
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawRuneNodes(ctx: CanvasRenderingContext2D, now: number): void {
    const nodes = this.engine.getNodes();
    nodes.forEach(node => this.drawRuneNode(ctx, node, now));
  }

  private drawRuneNode(ctx: CanvasRenderingContext2D, node: RuneNode, now: number): void {
    const pulse = 0.7 + Math.sin(now * 0.004 + node.pulsePhase) * 0.3;
    const activated = node.activated;

    ctx.save();
    ctx.translate(node.x, node.y);

    if (activated) {
      const glow = 20 + pulse * 15;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = glow;
    }

    ctx.save();
    ctx.rotate(now * 0.0008 + node.pulsePhase * 0.1);
    ctx.strokeStyle = activated
      ? `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`
      : `rgba(197, 165, 90, ${0.3 + pulse * 0.1})`;
    ctx.lineWidth = activated ? 2.5 : 1.5;
    this.drawRuneOutline(ctx, node.shape, node.size + 12);
    ctx.stroke();
    ctx.restore();

    this.drawRuneSymbol(ctx, node.shape, node.size, activated ? node.color : 'rgba(197, 165, 90, 0.5)');

    if (activated && node.energy < 1) {
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, node.size + 20, -Math.PI / 2, -Math.PI / 2 + node.energy * Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawRuneOutline(ctx: CanvasRenderingContext2D, shape: RuneShape, size: number): void {
    ctx.beginPath();
    switch (shape) {
      case 'triangle':
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * size;
          const y = Math.sin(a) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case 'circle':
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.rect(-size, -size, size * 2, size * 2);
        break;
      case 'diamond':
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * size;
          const y = Math.sin(a) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case 'spiral':
        for (let i = 0; i < 720; i++) {
          const a = (i / 180) * Math.PI;
          const r = (i / 720) * size;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        break;
      case 'lightning':
        ctx.moveTo(-size * 0.3, -size);
        ctx.lineTo(size * 0.2, -size * 0.2);
        ctx.lineTo(-size * 0.1, -size * 0.1);
        ctx.lineTo(size * 0.4, size);
        ctx.lineTo(-size * 0.1, size * 0.1);
        ctx.lineTo(size * 0.2, 0);
        ctx.closePath();
        break;
    }
  }

  private drawRuneSymbol(ctx: CanvasRenderingContext2D, shape: RuneShape, size: number, color: string): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape) {
      case 'triangle':
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * size;
          const y = Math.sin(a) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      case 'square':
        ctx.beginPath();
        ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.7, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.7, 0);
        ctx.closePath();
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      case 'hexagon':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * size;
          const y = Math.sin(a) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      case 'spiral':
        ctx.beginPath();
        for (let i = 0; i < 720; i++) {
          const a = (i / 180) * Math.PI;
          const r = (i / 720) * size;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      case 'lightning':
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, -size);
        ctx.lineTo(size * 0.2, -size * 0.2);
        ctx.lineTo(-size * 0.1, -size * 0.1);
        ctx.lineTo(size * 0.4, size);
        ctx.lineTo(-size * 0.1, size * 0.1);
        ctx.lineTo(size * 0.2, 0);
        ctx.lineTo(-size * 0.3, -size);
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  private drawCurrentStroke(ctx: CanvasRenderingContext2D): void {
    const stroke = this.engine.getCurrentStroke();
    if (stroke.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < stroke.length; i++) {
      const p0 = stroke[i - 1];
      const p1 = stroke[i];
      const t = Math.min(1, p1.speed / 3);
      const color = this.interpolateColor('#6A5ACD', '#FFD700', t);

      ctx.strokeStyle = color;
      ctx.lineWidth = 3 + t * 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 + t * 10;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCompletedRune(ctx: CanvasRenderingContext2D, now: number): void {
    const rune = this.engine.getCompletedRune();
    if (!rune.shape || rune.points.length < 2) return;

    const age = now - rune.formationTime;
    const pulse = 0.7 + Math.sin(rune.pulsePhase) * 0.3;
    let alpha = 1;
    if (age < 500) {
      alpha = age / 500;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const shapeColor = this.getShapeColor(rune.shape);

    ctx.strokeStyle = shapeColor;
    ctx.lineWidth = 4 + pulse * 2;
    ctx.shadowColor = shapeColor;
    ctx.shadowBlur = 20 + pulse * 15;

    ctx.beginPath();
    ctx.moveTo(rune.points[0].x, rune.points[0].y);
    for (let i = 1; i < rune.points.length; i++) {
      ctx.lineTo(rune.points[i].x, rune.points[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 5;
    ctx.stroke();

    ctx.restore();
  }

  private getShapeColor(shape: RuneShape): string {
    const colors: Record<RuneShape, string> = {
      triangle: '#6A5ACD',
      circle: '#95A5A6',
      square: '#3498DB',
      diamond: '#2ECC71',
      hexagon: '#E74C3C',
      spiral: '#9B59B6',
      lightning: '#F1C40F'
    };
    return colors[shape];
  }

  private interpolateColor(c1: string, c2: string, t: number): string {
    const rgb1 = this.hexToRgb(c1);
    const rgb2 = this.hexToRgb(c2);
    if (!rgb1 || !rgb2) return c1;
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  private drawChains(ctx: CanvasRenderingContext2D, now: number): void {
    const chains = this.engine.getChains();
    chains.forEach(chain => this.drawChain(ctx, chain, now));
  }

  private drawChain(ctx: CanvasRenderingContext2D, chain: LightChain, _now: number): void {
    const t = chain.progress;
    if (t <= 0) return;

    ctx.save();
    const mx = (chain.fromX + chain.toX) / 2;
    const my = (chain.fromY + chain.toY) / 2 - 60;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 30; i++) {
      const p = (i / 30) * t;
      const x = this.bezier(chain.fromX, mx, chain.toX, p);
      const y = this.bezier(chain.fromY, my, chain.toY, p);
      points.push({ x, y });
    }

    ctx.strokeStyle = chain.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = chain.color;
    ctx.shadowBlur = 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.stroke();

    if (points.length > 0) {
      const tip = points[points.length - 1];
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = chain.color;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private bezier(p0: number, p1: number, p2: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    const particles = this.engine.getParticles();
    ctx.save();
    particles.forEach(p => {
      const lifeRatio = 1 - p.life / p.maxLife;
      ctx.globalAlpha = lifeRatio;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  private drawFlashEffects(ctx: CanvasRenderingContext2D): void {
    const flashes = this.engine.getFlashEffects();
    flashes.forEach(f => {
      ctx.save();
      ctx.globalAlpha = f.opacity * 0.7;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    });
  }

  private drawTextEffects(ctx: CanvasRenderingContext2D): void {
    const texts = this.engine.getTextEffects();
    texts.forEach(t => {
      if (t.scale <= 0) return;
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.font = `bold ${t.scale}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.filter = `blur(${t.blur}px)`;
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFA500';
      ctx.shadowBlur = 30;
      ctx.fillText(t.text, t.x, t.y);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }

  private drawScoreFlash(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.scoreFlashTime;
    if (elapsed > 500) return;
    const p = elapsed / 500;
    const alpha = (1 - p) * 0.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
