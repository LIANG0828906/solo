import {
  Particle,
  ParticleType,
  BurstParticle,
  SwapInfo,
  PARTICLE_COLORS,
  GameStateSnapshot
} from './types';
import {
  easeOutCubic,
  easeInOutCubic,
  easeOutElastic,
  easeOutBack,
  clamp,
  lerp,
  randomRange
} from './utils';

export interface RendererConfig {
  cellSize: number;
  spacing: number;
  padding: number;
}

const DEFAULT_CONFIG: RendererConfig = {
  cellSize: 50,
  spacing: 2,
  padding: 0
};

export class Renderer {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _config: RendererConfig;
  private _gridOffsetX: number = 0;
  private _gridOffsetY: number = 0;
  private _burstParticles: BurstParticle[] = [];
  private _selectedCell: { row: number; col: number } | null = null;
  private _swapAnimation: SwapInfo | null = null;
  private _glowPulse: { intensity: number; time: number; duration: number } | null = null;
  private _pulseScales: Map<number, { scale: number; target: number; startTime: number }> =
    new Map();
  private _time: number = 0;
  private _dpr: number = 1;

  constructor(canvas: HTMLCanvasElement, config?: Partial<RendererConfig>) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this._ctx = ctx;
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  }

  public get config(): RendererConfig {
    return this._config;
  }

  public setGridOffset(x: number, y: number): void {
    this._gridOffsetX = x;
    this._gridOffsetY = y;
  }

  public resize(width: number, height: number): void {
    this._dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this._canvas.width = Math.floor(width * this._dpr);
    this._canvas.height = Math.floor(height * this._dpr);
    this._canvas.style.width = width + 'px';
    this._canvas.style.height = height + 'px';
    this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
  }

  public setSelected(row: number | null, col: number | null): void {
    if (row === null || col === null) {
      this._selectedCell = null;
    } else {
      this._selectedCell = { row, col };
    }
  }

  public setSwapAnimation(info: SwapInfo | null): void {
    this._swapAnimation = info;
  }

  public triggerPulse(row: number, col: number, id: number): void {
    this._pulseScales.set(id, { scale: 1, target: 1.2, startTime: this._time });
  }

  public createBurst(
    centerX: number,
    centerY: number,
    color: string,
    count: number = 30
  ): void {
    const maxAllowed = 50;
    const toAdd = Math.min(count, maxAllowed - this._burstParticles.length);
    if (toAdd <= 0) return;
    for (let i = 0; i < toAdd; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(60, 180);
      const life = randomRange(0.4, 0.75);
      this._burstParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color,
        life,
        maxLife: life,
        size: randomRange(2, 5)
      });
    }
  }

  public triggerGlowPulse(intensity: number = 0.5): void {
    this._glowPulse = { intensity, time: 0, duration: 0.6 };
  }

  private _cellToPixel(row: number, col: number): { x: number; y: number } {
    const { cellSize, spacing } = this._config;
    const total = cellSize + spacing;
    return {
      x: this._gridOffsetX + col * total + spacing,
      y: this._gridOffsetY + row * total + spacing
    };
  }

  private _pixelToCell(x: number, y: number): { row: number; col: number } {
    const { cellSize, spacing } = this._config;
    const total = cellSize + spacing;
    const localX = x - this._gridOffsetX - spacing;
    const localY = y - this._gridOffsetY - spacing;
    return {
      col: Math.floor(localX / total),
      row: Math.floor(localY / total)
    };
  }

  public pointToCell(px: number, py: number): { row: number; col: number } {
    return this._pixelToCell(px, py);
  }

  public getGridTotalSize(rows: number, cols: number): { w: number; h: number } {
    const { cellSize, spacing } = this._config;
    return {
      w: cols * cellSize + (cols + 1) * spacing,
      h: rows * cellSize + (rows + 1) * spacing
    };
  }

  public render(state: GameStateSnapshot, dt: number): void {
    this._time += dt;
    this._updateBurstParticles(dt);
    if (this._glowPulse) {
      this._glowPulse.time += dt;
      if (this._glowPulse.time >= this._glowPulse.duration) {
        this._glowPulse = null;
      }
    }
    const ctx = this._ctx;
    const w = this._canvas.width / this._dpr;
    const h = this._canvas.height / this._dpr;
    ctx.clearRect(0, 0, w, h);
    this._drawBackground(w, h);
    this._drawGrid(state.rows, state.cols);
    this._drawParticles(state, dt);
    this._drawBurstParticles();
    this._drawSelectionHighlight();
    this._drawGlowPulse(w, h);
  }

  private _drawBackground(w: number, h: number): void {
    // 背景渐变由 CSS 提供，这里只画一些装饰性的量子点
    const ctx = this._ctx;
    ctx.save();
    ctx.globalAlpha = 0.08;
    const dotCount = 40;
    for (let i = 0; i < dotCount; i++) {
      const seed = i * 137.5;
      const x = ((seed * 17.31 + this._time * 4) % w + w) % w;
      const y = ((seed * 9.77 + this._time * 2.5) % h + h) % h;
      const size = 1 + (i % 3);
      const hue = 210 + (i % 5) * 15;
      ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private _drawGrid(rows: number, cols: number): void {
    const ctx = this._ctx;
    const { cellSize, spacing } = this._config;
    const totalSize = this.getGridTotalSize(rows, cols);
    ctx.save();
    ctx.shadowColor = 'rgba(58, 110, 200, 0.3)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(13, 17, 40, 0.5)';
    this._roundRect(
      ctx,
      this._gridOffsetX,
      this._gridOffsetY,
      totalSize.w,
      totalSize.h,
      12
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const { x, y } = this._cellToPixel(r, c);
        ctx.fillStyle = 'rgba(13, 17, 40, 0.8)';
        this._roundRect(ctx, x, y, cellSize, cellSize, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(42, 58, 92, 0.9)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private _drawParticles(state: GameStateSnapshot, dt: number): void {
    const ctx = this._ctx;
    const { cellSize } = this._config;
    const swap = this._swapAnimation;
    let swapFromRender = { row: -1, col: -1 };
    let swapToRender = { row: -1, col: -1 };
    let swapT = 0;
    let swapRevert = false;
    if (swap) {
      swapT = clamp(swap.progress / swap.duration, 0, 1);
      swapRevert = swap.isReverting;
      swapFromRender = { ...swap.from };
      swapToRender = { ...swap.to };
    }
    const particlesToDraw: {
      p: Particle;
      x: number;
      y: number;
      overrideScale?: number;
      overrideOpacity?: number;
    }[] = [];
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const p = state.grid[r][c];
        if (!p) continue;
        let renderRow = p.renderY;
        let renderCol = p.renderX;
        if (swap) {
          const isFrom = r === swap.from.row && c === swap.from.col;
          const isTo = r === swap.to.row && c === swap.to.col;
          if (isFrom || isTo) {
            let t = swapT;
            if (swapRevert) {
              t = easeInOutCubic(t);
            } else {
              t = easeOutCubic(t);
            }
            if (isFrom) {
              renderCol = lerp(swap.from.col, swap.to.col, t);
              renderRow = lerp(swap.from.row, swap.to.row, t);
            } else if (isTo) {
              renderCol = lerp(swap.to.col, swap.from.col, t);
              renderRow = lerp(swap.to.row, swap.from.row, t);
            }
          }
        }
        let yOffsetProgress = 0;
        if (p.isNew && p.spawnProgress < 1) {
          yOffsetProgress = 1 - easeOutElastic(p.spawnProgress);
        }
        let scale = 1;
        if (p.isMatched) {
          const t = clamp(p.matchProgress, 0, 1);
          scale = 1 + t * 0.5;
        }
        if (p.isNew && p.spawnProgress < 1) {
          scale = clamp(easeOutBack(p.spawnProgress), 0, 1.2) * scale;
        }
        const pulseInfo = this._pulseScales.get(p.id);
        if (pulseInfo) {
          const pt = clamp((this._time - pulseInfo.startTime) / 0.25, 0, 1);
          const pulseScale = 1 + 0.25 * Math.sin(pt * Math.PI);
          scale *= pulseScale;
          if (pt >= 1) this._pulseScales.delete(p.id);
        }
        let opacity = 1;
        if (p.isMatched) {
          const t = clamp(p.matchProgress, 0, 1);
          opacity = 1 - easeOutCubic(t);
        }
        if (p.isNew && p.spawnProgress < 0.2) {
          opacity = Math.min(1, p.spawnProgress * 5);
        }
        const { x, y } = this._cellToPixel(renderRow, renderCol);
        const cellDrawY = y + yOffsetProgress * (-cellSize * 2 - 20);
        particlesToDraw.push({
          p,
          x: x + cellSize / 2,
          y: cellDrawY + cellSize / 2,
          overrideScale: scale,
          overrideOpacity: opacity
        });
      }
    }
    particlesToDraw.sort((a, b) => a.y - b.y);
    particlesToDraw.forEach((item) => {
      this._drawParticleShape(
        item.p,
        item.x,
        item.y,
        item.overrideScale ?? 1,
        item.overrideOpacity ?? 1
      );
    });
  }

  private _drawParticleShape(
    p: Particle,
    cx: number,
    cy: number,
    scale: number,
    opacity: number
  ): void {
    if (opacity <= 0) return;
    const ctx = this._ctx;
    const colors = PARTICLE_COLORS[p.type];
    const size = (this._config.cellSize * 0.78) * scale;
    const half = size / 2;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(cx, cy);
    const glow = ctx.createRadialGradient(0, 0, half * 0.2, 0, 0, half * 1.6);
    glow.addColorStop(0, colors.main + '66');
    glow.addColorStop(1, colors.main + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, half * 1.6, 0, Math.PI * 2);
    ctx.fill();
    switch (p.type) {
      case ParticleType.RED_CIRCLE:
        this._drawCircle(ctx, half, colors);
        break;
      case ParticleType.BLUE_SQUARE:
        this._drawSquare(ctx, half, colors);
        break;
      case ParticleType.GREEN_TRIANGLE:
        this._drawTriangle(ctx, half, colors);
        break;
      case ParticleType.PURPLE_DIAMOND:
        this._drawDiamond(ctx, half, colors);
        break;
      case ParticleType.GOLD_STAR:
        this._drawStar(ctx, half, colors);
        break;
    }
    ctx.restore();
  }

  private _drawCircle(
    ctx: CanvasRenderingContext2D,
    half: number,
    colors: { main: string; light: string; dark: string }
  ): void {
    const grad = ctx.createRadialGradient(-half * 0.3, -half * 0.3, half * 0.1, 0, 0, half);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, half, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-half * 0.3, -half * 0.35, half * 0.3, half * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.dark + '99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, half, 0, Math.PI * 2);
    ctx.stroke();
  }

  private _drawSquare(
    ctx: CanvasRenderingContext2D,
    half: number,
    colors: { main: string; light: string; dark: string }
  ): void {
    const r = half * 0.18;
    const grad = ctx.createLinearGradient(-half, -half, half, half);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    this._roundRect(ctx, -half, -half, half * 2, half * 2, r);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this._roundRect(ctx, -half * 0.6, -half * 0.65, half * 0.9, half * 0.3, r * 0.6);
    ctx.fill();
    ctx.strokeStyle = colors.dark + '99';
    ctx.lineWidth = 1;
    this._roundRect(ctx, -half + 0.5, -half + 0.5, half * 2 - 1, half * 2 - 1, r);
    ctx.stroke();
  }

  private _drawTriangle(
    ctx: CanvasRenderingContext2D,
    half: number,
    colors: { main: string; light: string; dark: string }
  ): void {
    const top = { x: 0, y: -half };
    const bl = { x: -half * 0.95, y: half * 0.8 };
    const br = { x: half * 0.95, y: half * 0.8 };
    const grad = ctx.createLinearGradient(0, -half, 0, half);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-half * 0.1, -half * 0.25, half * 0.35, half * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = colors.dark + '99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.closePath();
    ctx.stroke();
  }

  private _drawDiamond(
    ctx: CanvasRenderingContext2D,
    half: number,
    colors: { main: string; light: string; dark: string }
  ): void {
    const top = { x: 0, y: -half };
    const right = { x: half, y: 0 };
    const bottom = { x: 0, y: half };
    const left = { x: -half, y: 0 };
    const grad = ctx.createLinearGradient(-half, -half, half, half);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(left.x + half * 0.15, left.y + half * 0.15);
    ctx.lineTo(-half * 0.1, -half * 0.05);
    ctx.lineTo(top.x - half * 0.05, top.y + half * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = colors.dark + '99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.stroke();
  }

  private _drawStar(
    ctx: CanvasRenderingContext2D,
    half: number,
    colors: { main: string; light: string; dark: string }
  ): void {
    const spikes = 5;
    const outerR = half;
    const innerR = half * 0.45;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    const grad = ctx.createRadialGradient(-half * 0.2, -half * 0.2, half * 0.1, 0, 0, outerR);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.6, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-half * 0.15, -half * 0.3, half * 0.3, half * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = colors.dark + '99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  private _drawSelectionHighlight(): void {
    if (!this._selectedCell) return;
    const { row, col } = this._selectedCell;
    const { x, y } = this._cellToPixel(row, col);
    const { cellSize } = this._config;
    const ctx = this._ctx;
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 8);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 + pulse * 0.2})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;
    this._roundRect(ctx, x - 1, y - 1, cellSize + 2, cellSize + 2, 8);
    ctx.stroke();
    ctx.restore();
  }

  private _drawBurstParticles(): void {
    const ctx = this._ctx;
    ctx.save();
    for (const bp of this._burstParticles) {
      const alpha = clamp(bp.life / bp.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = bp.color;
      ctx.shadowColor = bp.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private _updateBurstParticles(dt: number): void {
    for (let i = this._burstParticles.length - 1; i >= 0; i--) {
      const bp = this._burstParticles[i];
      bp.life -= dt;
      if (bp.life <= 0) {
        this._burstParticles.splice(i, 1);
        continue;
      }
      bp.vy += 220 * dt;
      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;
      bp.vx *= 0.98;
    }
  }

  private _drawGlowPulse(w: number, h: number): void {
    if (!this._glowPulse) return;
    const t = clamp(this._glowPulse.time / this._glowPulse.duration, 0, 1);
    const strength = this._glowPulse.intensity * (1 - easeOutCubic(t));
    if (strength <= 0) return;
    const ctx = this._ctx;
    ctx.save();
    const margin = 40;
    const grad = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.15,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.7
    );
    grad.addColorStop(0, `rgba(140, 180, 255, 0)`);
    grad.addColorStop(0.7, `rgba(140, 180, 255, ${0.12 * strength})`);
    grad.addColorStop(1, `rgba(180, 140, 255, ${0.35 * strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const edgeThickness = margin + strength * 30;
    const edgeTop = ctx.createLinearGradient(0, 0, 0, edgeThickness);
    edgeTop.addColorStop(0, `rgba(120, 160, 255, ${0.5 * strength})`);
    edgeTop.addColorStop(1, `rgba(120, 160, 255, 0)`);
    ctx.fillStyle = edgeTop;
    ctx.fillRect(0, 0, w, edgeThickness);
    const edgeBottom = ctx.createLinearGradient(0, h, 0, h - edgeThickness);
    edgeBottom.addColorStop(0, `rgba(120, 160, 255, ${0.5 * strength})`);
    edgeBottom.addColorStop(1, `rgba(120, 160, 255, 0)`);
    ctx.fillStyle = edgeBottom;
    ctx.fillRect(0, h - edgeThickness, w, edgeThickness);
    const edgeLeft = ctx.createLinearGradient(0, 0, edgeThickness, 0);
    edgeLeft.addColorStop(0, `rgba(120, 160, 255, ${0.5 * strength})`);
    edgeLeft.addColorStop(1, `rgba(120, 160, 255, 0)`);
    ctx.fillStyle = edgeLeft;
    ctx.fillRect(0, 0, edgeThickness, h);
    const edgeRight = ctx.createLinearGradient(w, 0, w - edgeThickness, 0);
    edgeRight.addColorStop(0, `rgba(120, 160, 255, ${0.5 * strength})`);
    edgeRight.addColorStop(1, `rgba(120, 160, 255, 0)`);
    ctx.fillStyle = edgeRight;
    ctx.fillRect(w - edgeThickness, 0, edgeThickness, h);
    ctx.restore();
  }

  private _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export default Renderer;
