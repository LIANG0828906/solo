import type { GameState, HexCell, ElementType, HexCoord } from './gameEngine';
import { getGridSize } from './gameEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface PlaceAnimation {
  q: number;
  r: number;
  startTime: number;
  duration: number;
}

interface ExplosionAnimation {
  q: number;
  r: number;
  startTime: number;
  duration: number;
}

const ELEMENT_COLORS: {
  [key in ElementType]: { start: string; end: string; glow: string };
} = {
  fire: { start: '#FF4500', end: '#FFD700', glow: '#FF6B35' },
  water: { start: '#0000CD', end: '#00BFFF', glow: '#4FC3F7' },
  earth: { start: '#8B4513', end: '#6B8E23', glow: '#8BC34A' },
  wind: { start: '#C0C0C0', end: '#E0F7FA', glow: '#B2EBF2' }
};

const GRID_BORDER_COLOR = 'rgba(255, 255, 255, 0.15)';
const GRID_BORDER_WIDTH = 1;

export class HexGridRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexSize: number = 30;
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private particles: Particle[] = [];
  private placeAnimations: PlaceAnimation[] = [];
  private explosionAnimations: ExplosionAnimation[] = [];
  private hoveredCell: HexCoord | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');
    this.ctx = ctx;
  }

  resize(containerWidth: number, containerHeight: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = containerWidth * dpr;
    this.canvas.height = containerHeight * dpr;
    this.canvas.style.width = containerWidth + 'px';
    this.canvas.style.height = containerHeight + 'px';
    this.ctx.scale(dpr, dpr);

    const gridSize = getGridSize();
    const maxHexWidth = (containerWidth - 100) / (gridSize * 1.5 + 0.5);
    const maxHexHeight = (containerHeight - 100) / (gridSize * Math.sqrt(3) + Math.sqrt(3) / 2);
    this.hexSize = Math.min(maxHexWidth, maxHexHeight, 32);

    this.gridWidth = gridSize * this.hexSize * 1.5 + this.hexSize * 0.5;
    this.gridHeight = gridSize * this.hexSize * Math.sqrt(3) + this.hexSize * Math.sqrt(3) * 0.5;

    this.offsetX = (containerWidth - this.gridWidth) / 2 + this.hexSize;
    this.offsetY = (containerHeight - this.gridHeight) / 2 + this.hexSize * Math.sqrt(3) / 2;
  }

  hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = this.hexSize * 1.5 * q + this.offsetX;
    const y = this.hexSize * Math.sqrt(3) * (r + 0.5 * (q % 2)) + this.offsetY;
    return { x, y };
  }

  pixelToHex(px: number, py: number): { q: number; r: number } | null {
    const gridSize = getGridSize();
    let bestQ = -1;
    let bestR = -1;
    let bestDist = Infinity;

    for (let r = 0; r < gridSize; r++) {
      for (let q = 0; q < gridSize; q++) {
        const { x, y } = this.hexToPixel(q, r);
        const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
        if (dist < this.hexSize * 0.9 && dist < bestDist) {
          bestDist = dist;
          bestQ = q;
          bestR = r;
        }
      }
    }

    if (bestQ < 0 || bestR < 0) return null;
    return { q: bestQ, r: bestR };
  }

  drawHexagon(
    cx: number,
    cy: number,
    size: number,
    fillStyle?: string | CanvasGradient,
    strokeStyle?: string,
    lineWidth: number = 1
  ): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();

    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }

    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
  }

  createElementGradient(
    cx: number,
    cy: number,
    size: number,
    element: ElementType,
    level: number = 1
  ): CanvasGradient {
    const colors = ELEMENT_COLORS[element];
    const gradient = this.ctx.createRadialGradient(
      cx - size * 0.2,
      cy - size * 0.2,
      0,
      cx,
      cy,
      size
    );

    const darkenFactor = 1 - (level - 1) * 0.1;
    const startColor = this.adjustColorHex(colors.start, darkenFactor);
    const endColor = this.adjustColorHex(colors.end, darkenFactor);
    const shadowColor = this.adjustColorHex(colors.start, darkenFactor * 0.7);

    gradient.addColorStop(0, endColor);
    gradient.addColorStop(0.7, startColor);
    gradient.addColorStop(1, shadowColor);

    return gradient;
  }

  adjustColorHex(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const nr = Math.round(Math.min(255, Math.max(0, r * factor)));
    const ng = Math.round(Math.min(255, Math.max(0, g * factor)));
    const nb = Math.round(Math.min(255, Math.max(0, b * factor)));

    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  render(state: GameState, currentTime: number): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const gridSize = getGridSize();

    for (let r = 0; r < gridSize; r++) {
      for (let q = 0; q < gridSize; q++) {
        const cell = state.grid[r][q];
        const { x, y } = this.hexToPixel(q, r);

        this.drawHexagon(x, y, this.hexSize * 0.95, undefined, GRID_BORDER_COLOR, GRID_BORDER_WIDTH);

        if (cell.owner && cell.element) {
          this.renderCellContent(cell, x, y, currentTime);
        }
      }
    }

    if (this.hoveredCell && !state.isAnimating) {
      const cell = state.grid[this.hoveredCell.r][this.hoveredCell.q];
      if (!cell.owner) {
        const { x, y } = this.hexToPixel(this.hoveredCell.q, this.hoveredCell.r);
        this.ctx.globalAlpha = 0.3;
        const gradient = this.createElementGradient(
          x,
          y,
          this.hexSize * 0.85 * 0.85,
          state.players[state.currentPlayer].selectedElement
        );
        this.drawHexagon(x, y, this.hexSize * 0.85 * 0.85, gradient);
        this.ctx.globalAlpha = 1;
      }
    }

    this.updateParticles();
    this.renderParticles();
  }

  renderCellContent(cell: HexCell, x: number, y: number, currentTime: number): void {
    if (!cell.element) return;

    let scale = 1;
    const placeAnim = this.placeAnimations.find(
      (a) => a.q === cell.coord.q && a.r === cell.coord.r
    );
    if (placeAnim) {
      const elapsed = currentTime - placeAnim.startTime;
      const progress = Math.min(elapsed / placeAnim.duration, 1);
      const pulse = Math.sin(progress * Math.PI);
      scale = 1 + pulse * 0.05;

      if (progress >= 1) {
        const idx = this.placeAnimations.indexOf(placeAnim);
        if (idx > -1) this.placeAnimations.splice(idx, 1);
      }
    }

    const explAnim = this.explosionAnimations.find(
      (a) => a.q === cell.coord.q && a.r === cell.coord.r
    );
    if (explAnim) {
      const elapsed = currentTime - explAnim.startTime;
      const progress = Math.min(elapsed / explAnim.duration, 1);
      this.ctx.globalAlpha = 1 - progress;
      scale = 1 + progress * 0.5;
    }

    const innerSize = this.hexSize * 0.85 * scale;
    const levelSizeMultiplier = 1 + (cell.level - 1) * 0.15;
    const finalSize = innerSize * levelSizeMultiplier;

    const gradient = this.createElementGradient(x, y, finalSize, cell.element, cell.level);
    this.drawHexagon(x, y, finalSize, gradient);

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const glowGradient = this.ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      finalSize * 1.2
    );
    const glowColor = ELEMENT_COLORS[cell.element].glow;
    glowGradient.addColorStop(0, glowColor + '40');
    glowGradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, finalSize * 1.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    const highlightGradient = this.ctx.createRadialGradient(
      x - finalSize * 0.3,
      y - finalSize * 0.3,
      0,
      x - finalSize * 0.1,
      y - finalSize * 0.1,
      finalSize * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = highlightGradient;
    this.ctx.beginPath();
    this.ctx.arc(x - finalSize * 0.1, y - finalSize * 0.1, finalSize * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }

  addPlaceAnimation(q: number, r: number, currentTime: number): void {
    this.placeAnimations.push({
      q,
      r,
      startTime: currentTime,
      duration: 300
    });
  }

  addFusionParticles(q: number, r: number, element: ElementType, currentTime: number): void {
    const { x, y } = this.hexToPixel(q, r);
    const color = ELEMENT_COLORS[element].glow;

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 30 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000,
        maxLife: 1000,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }

  addExplosionAnimation(q: number, r: number, currentTime: number): void {
    this.explosionAnimations.push({
      q,
      r,
      startTime: currentTime,
      duration: 500
    });

    const { x, y } = this.hexToPixel(q, r);
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 80;
      const colors = ['#FF6B35', '#FFD700', '#FF4500', '#FFE066'];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800,
        maxLife: 800,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4
      });
    }
  }

  updateParticles(): void {
    const dt = 1 / 60;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt * 1000;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  renderParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  setHoveredCell(cell: HexCoord | null): void {
    this.hoveredCell = cell;
  }

  hasActiveAnimations(): boolean {
    return (
      this.placeAnimations.length > 0 ||
      this.explosionAnimations.length > 0 ||
      this.particles.length > 0
    );
  }

  cleanupExplosions(state: GameState, currentTime: number): void {
    for (let i = this.explosionAnimations.length - 1; i >= 0; i--) {
      const anim = this.explosionAnimations[i];
      const elapsed = currentTime - anim.startTime;
      if (elapsed >= anim.duration) {
        this.explosionAnimations.splice(i, 1);
      }
    }
  }
}
