import {
  HexCell,
  RuneType,
  SpellType,
  PlayerID,
  HEX_RADIUS,
  HEX_SPACING,
  GRID_COLS,
  GRID_ROWS,
  hexToPixel,
  pixelToHex,
  getPlayerTerritory,
  SpellResult,
} from '../engine/gameEngine';
import { useGameStore, Particle, SpellAnimation, HitAnimation } from '../stores/gameStore';

const SQRT3 = Math.sqrt(3);

const COLORS = {
  background: '#0D0D1A',
  hexFill: '#2D2D44',
  hexBorder: '#4A4A6A',
  hexHoverValid: 'rgba(60, 179, 113, 0.4)',
  hexHoverInvalid: 'rgba(255, 99, 71, 0.3)',
  selectedGlow: '#FFD700',
  fireColor: '#FF8C00',
  waterColor: '#4169E1',
  woodColor: '#32CD32',
  cooldownAlpha: 0.4,
  borderGlowInner: '#6A5ACD',
  borderGlowOuter: '#483D8B',
  frostOverlay: 'rgba(100, 149, 237, 0.25)',
  hitFlash: 'rgba(255, 50, 50, 0.6)',
};

export class HexRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private centerX = 0;
  private centerY = 0;
  private animationFrameId: number | null = null;
  private unsubscribe: (() => void) | null = null;
  private canvasWidth = 800;
  private canvasHeight = 600;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.updateSize();
  }

  private updateSize() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const maxW = Math.min(container.clientWidth, 800);
    const ratio = 4 / 3;
    const w = maxW;
    const h = w / ratio;

    this.canvasWidth = w;
    this.canvasHeight = h;
    this.canvas.width = w * window.devicePixelRatio;
    this.canvas.height = h * window.devicePixelRatio;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    const R = HEX_RADIUS + HEX_SPACING;
    const gridPixelWidth = R * SQRT3 * (GRID_COLS - 1 + (GRID_ROWS - 1) / 2);
    const gridPixelHeight = R * 1.5 * (GRID_ROWS - 1);
    this.centerX = (w - gridPixelWidth) / 2 + R * SQRT3 * ((GRID_ROWS - 1) / 2) / 2;
    this.centerY = (h - gridPixelHeight) / 2;
  }

  start() {
    this.updateSize();

    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('resize', this.onResize);

    this.unsubscribe = useGameStore.subscribe(() => {});

    const loop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('resize', this.onResize);
    if (this.unsubscribe) this.unsubscribe();
  }

  private onResize = () => {
    this.updateSize();
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hex = pixelToHex(x, y, this.centerX, this.centerY);
    useGameStore.getState().setHoveredHex(hex);
  };

  private onClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hex = pixelToHex(x, y, this.centerX, this.centerY);
    if (hex) {
      useGameStore.getState().selectCell(hex.q, hex.r);
    }
  };

  private onMouseLeave = () => {
    useGameStore.getState().setHoveredHex(null);
  };

  private render() {
    const state = useGameStore.getState();
    const now = performance.now() / 1000;
    state.updateAnimations(now);

    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.clearRect(0, 0, w, h);

    this.drawBorder(ctx, w, h);

    if (state.frostOverlay) {
      const territory = getPlayerTerritory(state.frostOverlay);
      for (let r = territory.minR; r <= territory.maxR; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
          const pos = hexToPixel(q, r, this.centerX, this.centerY);
          this.drawHexPath(ctx, pos.x, pos.y, HEX_RADIUS);
          ctx.fillStyle = COLORS.frostOverlay;
          ctx.fill();
        }
      }
    }

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let q = 0; q < GRID_COLS; q++) {
        const cell = state.grid[r]?.[q];
        if (!cell) continue;
        const pos = hexToPixel(q, r, this.centerX, this.centerY);
        this.drawHexCell(ctx, pos.x, pos.y, cell, q, r, state);
      }
    }

    for (const anim of state.spellAnimations) {
      this.drawParticles(ctx, anim.particles, now - anim.startTime);
    }

    for (const anim of state.hitAnimations) {
      const elapsed = now - anim.startTime;
      if (elapsed < anim.duration) {
        const alpha = 1 - elapsed / anim.duration;
        const pos = hexToPixel(anim.q, anim.r, this.centerX, this.centerY);
        this.drawHexPath(ctx, pos.x, pos.y, HEX_RADIUS);
        ctx.fillStyle = `rgba(255, 50, 50, ${0.6 * alpha})`;
        ctx.fill();
        this.drawCrackEffect(ctx, pos.x, pos.y, alpha);
      }
    }
  }

  private drawBorder(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.shadowColor = COLORS.borderGlowOuter;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = COLORS.borderGlowInner;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.shadowBlur = 0;
  }

  private drawHexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  private drawHexCell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    cell: HexCell,
    q: number,
    r: number,
    state: ReturnType<typeof useGameStore.getState>
  ) {
    const isHovered = state.hoveredHex?.q === q && state.hoveredHex?.r === r;
    const isSelected = state.selectedCell?.q === q && state.selectedCell?.r === r;

    const isMoveTarget = state.validMoves.some(m => m.toQ === q && m.toR === r);
    const isPlaceTarget = state.validPlacements.some(p => p.q === q && p.r === r);
    const isValidTarget = isMoveTarget || isPlaceTarget;

    this.drawHexPath(ctx, cx, cy, HEX_RADIUS);
    ctx.fillStyle = COLORS.hexFill;
    ctx.fill();
    ctx.strokeStyle = COLORS.hexBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isHovered) {
      if (isValidTarget) {
        this.drawHexPath(ctx, cx, cy, HEX_RADIUS);
        ctx.fillStyle = COLORS.hexHoverValid;
        ctx.fill();
      } else if (cell.rune === null || cell.owner !== 'player' || cell.cooldown > 0) {
        this.drawHexPath(ctx, cx, cy, HEX_RADIUS);
        ctx.fillStyle = COLORS.hexHoverInvalid;
        ctx.fill();

        const size = 8;
        ctx.strokeStyle = `rgba(255, 99, 71, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - size, cy - size);
        ctx.lineTo(cx + size, cy + size);
        ctx.moveTo(cx + size, cy - size);
        ctx.lineTo(cx - size, cy + size);
        ctx.stroke();
      }
    }

    if (isSelected) {
      this.drawHexPath(ctx, cx, cy, HEX_RADIUS + 2);
      ctx.strokeStyle = COLORS.selectedGlow;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.selectedGlow;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (cell.rune !== null) {
      const alpha = cell.cooldown > 0 ? COLORS.cooldownAlpha : 1;
      ctx.globalAlpha = alpha;
      this.drawRuneSymbol(ctx, cx, cy, cell.rune);

      if (cell.cooldown > 0) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#AAA';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, -Math.PI / 2, Math.PI);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }

  private drawRuneSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, rune: RuneType) {
    switch (rune) {
      case RuneType.Fire:
        this.drawFireSymbol(ctx, cx, cy);
        break;
      case RuneType.Water:
        this.drawWaterSymbol(ctx, cx, cy);
        break;
      case RuneType.Wood:
        this.drawWoodSymbol(ctx, cx, cy);
        break;
    }
  }

  private drawFireSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = COLORS.fireColor;
    ctx.shadowColor = COLORS.fireColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 10, cy + 8);
    ctx.lineTo(cx + 3, cy + 4);
    ctx.lineTo(cx, cy + 10);
    ctx.lineTo(cx - 3, cy + 4);
    ctx.lineTo(cx - 10, cy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 4, cy + 3);
    ctx.lineTo(cx, cy + 1);
    ctx.lineTo(cx - 4, cy + 3);
    ctx.closePath();
    ctx.fill();
  }

  private drawWaterSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = COLORS.waterColor;
    ctx.shadowColor = COLORS.waterColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.bezierCurveTo(cx + 12, cy - 4, cx + 10, cy + 10, cx, cy + 12);
    ctx.bezierCurveTo(cx - 10, cy + 10, cx - 12, cy - 4, cx, cy - 14);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - 2, 3, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWoodSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = COLORS.woodColor;
    ctx.shadowColor = COLORS.woodColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.bezierCurveTo(cx + 14, cy - 10, cx + 14, cy + 4, cx + 2, cy + 12);
    ctx.lineTo(cx - 2, cy + 12);
    ctx.bezierCurveTo(cx - 14, cy + 4, cx - 14, cy - 10, cx, cy - 12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 12);
    ctx.lineTo(cx, cy - 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.quadraticCurveTo(cx + 6, cy - 6, cx + 8, cy - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.quadraticCurveTo(cx - 6, cy - 2, cx - 8, cy + 2);
    ctx.stroke();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], elapsed: number) {
    for (const p of particles) {
      if (p.life <= 0) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'droplet':
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size, 0, p.size, p.size, 0, p.size * 1.5);
          ctx.bezierCurveTo(-p.size, p.size, -p.size, 0, 0, -p.size);
          ctx.fill();
          ctx.restore();
          break;
        case 'leaf':
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size, -p.size * 0.5, p.size, p.size * 0.5, 0, p.size);
          ctx.bezierCurveTo(-p.size, p.size * 0.5, -p.size, -p.size * 0.5, 0, -p.size);
          ctx.fill();
          ctx.restore();
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawCrackEffect(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha: number) {
    ctx.strokeStyle = `rgba(200, 50, 50, ${alpha * 0.8})`;
    ctx.lineWidth = 1.5;
    const cracks = [
      [[0, 0], [-8, -12], [-14, -8]],
      [[0, 0], [6, -10], [12, -6]],
      [[0, 0], [-4, 10], [-10, 14]],
      [[0, 0], [8, 8], [14, 4]],
      [[0, 0], [0, -14], [-4, -18]],
    ];

    for (const crack of cracks) {
      ctx.beginPath();
      ctx.moveTo(cx + crack[0][0], cy + crack[0][1]);
      for (let i = 1; i < crack.length; i++) {
        ctx.lineTo(cx + crack[i][0], cy + crack[i][1]);
      }
      ctx.stroke();
    }
  }

  getHexAtPixel(x: number, y: number): { q: number; r: number } | null {
    return pixelToHex(x, y, this.centerX, this.centerY);
  }
}
