import {
  GameState,
  TerrainType,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../game/GameEngine';

const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.GRASS]: '#7ec850',
  [TerrainType.BUSH]: '#3a7d2c',
  [TerrainType.MUD]: '#8b5a2b',
  [TerrainType.RIVER]: '#3b82f6',
};

const CELL_BORDER = 'rgba(255,255,255,0.35)';
const HIGHLIGHT_COLOR = '#fbbf24';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cellSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private time: number = 0;
  private lastWidth: number = 0;
  private lastHeight: number = 0;
  private ro: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => {
        this.resize();
      });
      this.ro.observe(canvas);
    }
    this.resize();
  }

  destroy(): void {
    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    }
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (this.canvas.width !== rect.width * dpr || this.canvas.height !== rect.height * dpr) {
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    const maxCellWidth = rect.width / GRID_WIDTH;
    const maxCellHeight = rect.height / GRID_HEIGHT;
    this.cellSize = Math.min(maxCellWidth, maxCellHeight);

    const gridPixelWidth = this.cellSize * GRID_WIDTH;
    const gridPixelHeight = this.cellSize * GRID_HEIGHT;
    this.offsetX = (rect.width - gridPixelWidth) / 2;
    this.offsetY = (rect.height - gridPixelHeight) / 2;
    this.lastWidth = rect.width;
    this.lastHeight = rect.height;
  }

  getCellAtPixel(px: number, py: number): { x: number; y: number } | null {
    const x = Math.floor((px - this.offsetX) / this.cellSize);
    const y = Math.floor((py - this.offsetY) / this.cellSize);
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return null;
    return { x, y };
  }

  getCellCenter(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: this.offsetX + x * this.cellSize + this.cellSize / 2,
      cy: this.offsetY + y * this.cellSize + this.cellSize / 2,
    };
  }

  render(state: GameState, timestamp: number): void {
    this.time = timestamp;
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();

    if (
      rect.width > 0 &&
      rect.height > 0 &&
      (rect.width !== this.lastWidth || rect.height !== this.lastHeight)
    ) {
      this.resize();
    }

    if (this.cellSize <= 0) return;

    ctx.clearRect(0, 0, rect.width, rect.height);

    this.drawGrid(state);
    this.drawFruits(state);

    const antelopePos = this.getEntityPosition(state, 'antelope');
    const cheetahPos = this.getEntityPosition(state, 'cheetah');

    if (state.animation && state.animation.isAnimating) {
      this.drawAfterimage(state.animation);
    }

    this.drawAntelope(antelopePos.cx, antelopePos.cy);
    this.drawCheetah(cheetahPos.cx, cheetahPos.cy);

    if (state.selectedCell && !state.isGameOver) {
      this.drawHighlight(state.selectedCell.x, state.selectedCell.y);
    }
  }

  private getEntityPosition(
    state: GameState,
    entity: 'cheetah' | 'antelope'
  ): { cx: number; cy: number } {
    const anim = state.animation;
    if (anim && anim.isAnimating && anim.entity === entity) {
      const t = easeOutCubic(anim.progress);
      const from = this.getCellCenter(anim.fromX, anim.fromY);
      const to = this.getCellCenter(anim.toX, anim.toY);
      return {
        cx: lerp(from.cx, to.cx, t),
        cy: lerp(from.cy, to.cy, t),
      };
    }
    const e = entity === 'cheetah' ? state.cheetah : state.antelope;
    return this.getCellCenter(e.x, e.y);
  }

  private drawGrid(state: GameState): void {
    const ctx = this.ctx;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.drawCell(x, y, state.grid[y][x].terrain);
      }
    }
    ctx.strokeStyle = CELL_BORDER;
    ctx.lineWidth = 1;
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX, this.offsetY + y * this.cellSize);
      ctx.lineTo(this.offsetX + GRID_WIDTH * this.cellSize, this.offsetY + y * this.cellSize);
      ctx.stroke();
    }
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX + x * this.cellSize, this.offsetY);
      ctx.lineTo(this.offsetX + x * this.cellSize, this.offsetY + GRID_HEIGHT * this.cellSize);
      ctx.stroke();
    }
  }

  private drawCell(x: number, y: number, terrain: TerrainType): void {
    const ctx = this.ctx;
    const px = this.offsetX + x * this.cellSize;
    const py = this.offsetY + y * this.cellSize;

    ctx.fillStyle = TERRAIN_COLORS[terrain];
    ctx.fillRect(px, py, this.cellSize, this.cellSize);

    const patternSize = Math.max(4, this.cellSize * 0.08);
    ctx.save();
    if (terrain === TerrainType.BUSH) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 5; i++) {
        const dx = ((x * 73 + i * 31) % 90) / 100 * this.cellSize;
        const dy = ((y * 47 + i * 53) % 90) / 100 * this.cellSize;
        ctx.beginPath();
        ctx.arc(px + dx + 4, py + dy + 4, patternSize * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (terrain === TerrainType.MUD) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 3; i++) {
        const dx = ((x * 61 + i * 43) % 80) / 100 * this.cellSize;
        const dy = ((y * 59 + i * 37) % 80) / 100 * this.cellSize;
        ctx.beginPath();
        ctx.ellipse(
          px + dx + patternSize * 2,
          py + dy + patternSize * 2,
          patternSize * 1.8,
          patternSize,
          (i * 0.7),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else if (terrain === TerrainType.RIVER) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const wy = py + this.cellSize * (0.25 + i * 0.25);
        ctx.beginPath();
        ctx.moveTo(px + 4, wy);
        ctx.bezierCurveTo(
          px + this.cellSize * 0.3,
          wy - 3,
          px + this.cellSize * 0.6,
          wy + 3,
          px + this.cellSize - 4,
          wy
        );
        ctx.stroke();
      }
    } else if (terrain === TerrainType.GRASS) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let i = 0; i < 6; i++) {
        const dx = ((x * 89 + i * 29) % 95) / 100 * this.cellSize;
        const dy = ((y * 71 + i * 41) % 95) / 100 * this.cellSize;
        ctx.fillRect(px + dx, py + dy, 2, patternSize);
      }
    }
    ctx.restore();
  }

  private drawCheetah(cx: number, cy: number, alpha: number = 1): void {
    const ctx = this.ctx;
    const r = this.cellSize * 0.35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
    gradient.addColorStop(0, '#ffb347');
    gradient.addColorStop(1, '#e67e22');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000000';
    const seedX = Math.floor(cx);
    const seedY = Math.floor(cy);
    const spotCount = 10;
    for (let i = 0; i < spotCount; i++) {
      const pseudo = Math.sin((i + seedX * 0.13 + seedY * 0.17) * 12.9898) * 43758.5453;
      const noise = pseudo - Math.floor(pseudo);
      const angle = noise * Math.PI * 2;
      const dist = (0.2 + ((pseudo * 100) % 60) / 100 * 0.6) * r;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const spotR = r * (0.08 + ((pseudo * 10) % 5) / 100);
      ctx.beginPath();
      ctx.arc(sx, sy, spotR, 0, Math.PI * 2);
      ctx.fill();
    }
    const fixedSpots = [
      [0.35, -0.25],
      [-0.15, -0.4],
      [-0.4, 0.0],
      [0.0, 0.1],
      [0.35, 0.35],
      [-0.3, 0.4],
      [0.1, -0.55],
      [-0.05, 0.5],
    ];
    for (const [sx, sy] of fixedSpots) {
      ctx.beginPath();
      ctx.arc(cx + r * sx, cy + r * sy, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.13, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.07, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawAntelope(cx: number, cy: number, alpha: number = 1): void {
    const ctx = this.ctx;
    const size = this.cellSize * 0.7;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx + size / 2, cy + size / 2);
    ctx.lineTo(cx - size / 2, cy + size / 2);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(cx, cy - size / 2, cx, cy + size / 2);
    gradient.addColorStop(0, '#a0623a');
    gradient.addColorStop(1, '#6b3f24');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const seedX = Math.floor(cx);
    const seedY = Math.floor(cy);
    const randSpots = 8;
    for (let i = 0; i < randSpots; i++) {
      const pseudo = Math.sin((i + seedX * 0.11 + seedY * 0.19) * 12.9898) * 43758.5453;
      const noise = pseudo - Math.floor(pseudo);
      const angle = noise * Math.PI * 2;
      const dist = (0.15 + ((pseudo * 100) % 55) / 100 * 0.55) * (size * 0.45);
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist * 0.9 + size * 0.05;
      const spotR = size * (0.035 + ((pseudo * 10) % 4) / 100);
      const insideTriangle =
        sy > cy - size / 2 + size * 0.08 && sy < cy + size / 2 - size * 0.08;
      if (insideTriangle) {
        ctx.beginPath();
        ctx.arc(sx, sy, spotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const fixedSpots = [
      [0.0, -0.1],
      [-0.25, 0.1],
      [0.2, 0.2],
      [0.0, 0.35],
      [-0.1, 0.25],
      [0.15, -0.05],
    ];
    for (const [sx, sy] of fixedSpots) {
      ctx.beginPath();
      ctx.arc(cx + size * sx * 0.5, cy + size * sy * 0.5, size * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - size * 0.12, cy + size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.12, cy + size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawFruits(state: GameState): void {
    const ctx = this.ctx;
    const pulse = 0.85 + Math.sin(this.time * 0.004) * 0.15;
    for (const fruit of state.fruits) {
      const { cx, cy } = this.getCellCenter(fruit.x, fruit.y);
      const r = this.cellSize * 0.18;

      ctx.save();
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 16 * pulse;
      const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#dc2626');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawHighlight(x: number, y: number): void {
    const ctx = this.ctx;
    const pulse = 0.7 + Math.sin(this.time * 0.006) * 0.3;
    const { cx, cy } = this.getCellCenter(x, y);
    const r = this.cellSize * 0.48 * pulse;

    ctx.save();
    ctx.strokeStyle = HIGHLIGHT_COLOR;
    ctx.lineWidth = 3;
    ctx.shadowColor = HIGHLIGHT_COLOR;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawAfterimage(anim: {
    entity: 'cheetah' | 'antelope';
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    progress: number;
  }): void {
    const trails = 5;
    for (let i = trails; i >= 1; i--) {
      const offset = i * 0.06;
      const trailT = Math.max(0, anim.progress - offset);
      if (trailT <= 0) continue;
      const t = easeOutCubic(trailT);
      const from = this.getCellCenter(anim.fromX, anim.fromY);
      const to = this.getCellCenter(anim.toX, anim.toY);
      const cx = lerp(from.cx, to.cx, t);
      const cy = lerp(from.cy, to.cy, t);
      const alpha = Math.max(0, (1 - i / (trails + 1)) * 0.55);

      if (anim.entity === 'cheetah') {
        this.drawCheetah(cx, cy, alpha);
      } else {
        this.drawAntelope(cx, cy, alpha);
      }
    }
  }
}
