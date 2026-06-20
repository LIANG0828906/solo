import { GameState, HeroUnit, AxialCoord, TerrainType, PlayerType, AnimationState } from '../types';
import { hexToPixel, pixelToHex, HEX_RADIUS, GRID_WIDTH, GRID_HEIGHT } from '../map/mapGenerator';

type HexClickListener = (coord: AxialCoord) => void;

const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.PLAIN]: '#90EE90',
  [TerrainType.FOREST]: '#228B22',
  [TerrainType.ROCK]: '#808080'
};

const PLAYER_COLORS: Record<PlayerType, string> = {
  [PlayerType.BLUE]: '#4169E1',
  [PlayerType.RED]: '#DC143C'
};

const HEX_STROKE_COLOR = '#2D2D44';
const SELECTED_HEX_COLOR = '#4A90D9';
const MOVE_HIGHLIGHT_COLOR = 'rgba(74, 144, 217, 0.35)';
const ATTACK_HIGHLIGHT_COLOR = 'rgba(220, 20, 60, 0.35)';

export class HexRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState | null = null;
  private animations: AnimationState[] = [];
  private clickListeners: HexClickListener[] = [];
  private offsetX: number = 0;
  private offsetY: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private deadUnits: Set<string> = new Set();
  private unitPositions: Map<string, { x: number; y: number }> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D context');
    }
    this.ctx = ctx;
    this.bindEvents();
    this.resize();
    this.startRenderLoop();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.resize();
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    this.calculateOffset();
  }

  private calculateOffset(): void {
    const gridPixelWidth = HEX_RADIUS * 3 / 2 * (GRID_WIDTH - 1) + HEX_RADIUS * 2;
    const gridPixelHeight = HEX_RADIUS * Math.sqrt(3) * (GRID_HEIGHT - 1) + HEX_RADIUS * Math.sqrt(3);

    const containerWidth = this.canvas.clientWidth;
    const containerHeight = this.canvas.clientHeight;

    this.offsetX = (containerWidth - gridPixelWidth) / 2 + HEX_RADIUS;
    this.offsetY = (containerHeight - gridPixelHeight) / 2 + HEX_RADIUS * Math.sqrt(3) / 2;
  }

  setState(state: GameState): void {
    this.state = state;

    for (const unit of state.units) {
      if (unit.hp <= 0 && !this.deadUnits.has(unit.id)) {
        this.deadUnits.add(unit.id);
        const pos = this.getUnitPixelPosition(unit);
        this.animations.push({
          type: 'death',
          unitId: unit.id,
          progress: 0,
          duration: 500,
          toX: pos.x,
          toY: pos.y
        });
      }
    }
  }

  onHexClick(listener: HexClickListener): void {
    this.clickListeners.push(listener);
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.offsetX;
    const y = e.clientY - rect.top - this.offsetY;

    const coord = pixelToHex(x, y);
    this.clickListeners.forEach(l => l(coord));
  }

  getUnitPixelPosition(unit: HeroUnit): { x: number; y: number } {
    const cached = this.unitPositions.get(unit.id);
    if (cached) return cached;

    if (!unit.position) {
      return { x: 0, y: 0 };
    }

    const pixel = hexToPixel(unit.position.q, unit.position.r);
    return {
      x: pixel.x + this.offsetX,
      y: pixel.y + this.offsetY
    };
  }

  private startRenderLoop(): void {
    const loop = (timestamp: number) => {
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      this.updateAnimations(deltaTime);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateAnimations(deltaTime: number): void {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.progress += deltaTime;

      if (anim.progress >= anim.duration) {
        if (anim.type === 'death' && anim.unitId) {
          this.unitPositions.delete(anim.unitId);
        }
        this.animations.splice(i, 1);
      }
    }
  }

  getAnimation(unitId: string): AnimationState | undefined {
    return this.animations.find(a => a.unitId === unitId);
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private render(): void {
    const startTime = performance.now();

    if (!this.state) return;

    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    this.drawGrid();
    this.drawHighlights();
    this.drawUnits();

    const renderTime = performance.now() - startTime;
    if (renderTime > 8) {
      console.warn(`Render took ${renderTime.toFixed(2)}ms, exceeds 8ms limit`);
    }
  }

  private drawGrid(): void {
    if (!this.state) return;

    for (let r = 0; r < GRID_HEIGHT; r++) {
      for (let q = 0; q < GRID_WIDTH; q++) {
        const cell = this.state.grid[r]?.[q];
        if (!cell) continue;

        this.drawHexagon(q, r, cell.terrain);
      }
    }
  }

  private drawHexagon(q: number, r: number, terrain: TerrainType): void {
    const pixel = hexToPixel(q, r);
    const x = pixel.x + this.offsetX;
    const y = pixel.y + this.offsetY;

    this.ctx.beginPath();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + HEX_RADIUS * Math.cos(angle);
      const hy = y + HEX_RADIUS * Math.sin(angle);

      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }

    this.ctx.closePath();
    this.ctx.fillStyle = TERRAIN_COLORS[terrain];
    this.ctx.fill();

    this.ctx.strokeStyle = HEX_STROKE_COLOR;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    if (terrain === TerrainType.FOREST) {
      this.drawForestDecoration(x, y);
    } else if (terrain === TerrainType.ROCK) {
      this.drawRockDecoration(x, y);
    }
  }

  private drawForestDecoration(x: number, y: number): void {
    this.ctx.fillStyle = '#0D6B0D';
    for (let i = 0; i < 3; i++) {
      const tx = x + (i - 1) * 10;
      const ty = y + (i % 2 === 0 ? -5 : 3);
      this.ctx.beginPath();
      this.ctx.moveTo(tx, ty - 8);
      this.ctx.lineTo(tx - 6, ty + 4);
      this.ctx.lineTo(tx + 6, ty + 4);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private drawRockDecoration(x: number, y: number): void {
    this.ctx.fillStyle = '#5A5A5A';
    this.ctx.beginPath();
    this.ctx.arc(x - 5, y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + 6, y + 3, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawHighlights(): void {
    const state = this.state;
    if (!state) return;

    const selectedUnit = state.selectedUnitId
      ? state.units.find(u => u.id === state.selectedUnitId)
      : null;

    if (selectedUnit) {
      const pixel = hexToPixel(selectedUnit.position.q, selectedUnit.position.r);
      const x = pixel.x + this.offsetX;
      const y = pixel.y + this.offsetY;

      this.drawHexagonHighlight(x, y, SELECTED_HEX_COLOR, 1);
    }

    for (const hex of state.highlightedHexes) {
      const pixel = hexToPixel(hex.q, hex.r);
      const x = pixel.x + this.offsetX;
      const y = pixel.y + this.offsetY;
      this.drawHexagonHighlight(x, y, MOVE_HIGHLIGHT_COLOR, 0.8);
    }

    if (selectedUnit && selectedUnit.player === state.currentPlayer && !selectedUnit.hasActed) {
      const enemyNeighbors = state.units.filter(u => {
        if (u.player === selectedUnit.player || u.hp <= 0) return false;
        const dist = (Math.abs(selectedUnit.position.q - u.position.q) +
          Math.abs(selectedUnit.position.q + selectedUnit.position.r - u.position.q - u.position.r) +
          Math.abs(selectedUnit.position.r - u.position.r)) / 2;
        return dist === 1;
      });

      for (const enemy of enemyNeighbors) {
        const pixel = hexToPixel(enemy.position.q, enemy.position.r);
        const x = pixel.x + this.offsetX;
        const y = pixel.y + this.offsetY;
        this.drawHexagonHighlight(x, y, ATTACK_HIGHLIGHT_COLOR, 0.8);
      }
    }
  }

  private drawHexagonHighlight(x: number, y: number, color: string, alpha: number): void {
    this.ctx.beginPath();
    this.ctx.globalAlpha = alpha;

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + HEX_RADIUS * Math.cos(angle);
      const hy = y + HEX_RADIUS * Math.sin(angle);

      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }

    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private drawUnits(): void {
    if (!this.state) return;

    for (const unit of this.state.units) {
      if (unit.hp <= 0) {
        this.drawDeadUnit(unit);
      } else {
        this.drawUnit(unit);
      }
    }
  }

  private drawUnit(unit: HeroUnit): void {
    let x: number, y: number;

    if (!unit.position) return;

    const moveAnim = this.animations.find(
      a => a.type === 'move' && a.unitId === unit.id
    );

    if (moveAnim && moveAnim.fromX !== undefined && moveAnim.fromY !== undefined &&
        moveAnim.toX !== undefined && moveAnim.toY !== undefined) {
      const t = Math.min(1, moveAnim.progress / moveAnim.duration);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      x = moveAnim.fromX + (moveAnim.toX - moveAnim.fromX) * easeT;
      y = moveAnim.fromY + (moveAnim.toY - moveAnim.fromY) * easeT;
      this.unitPositions.set(unit.id, { x, y });
    } else {
      const pixel = hexToPixel(unit.position.q, unit.position.r);
      x = pixel.x + this.offsetX;
      y = pixel.y + this.offsetY;
      this.unitPositions.set(unit.id, { x, y });
    }

    const attackAnim = this.animations.find(
      a => a.type === 'attack' && a.unitId === unit.id
    );

    this.ctx.save();

    if (unit.hasActed) {
      this.ctx.globalAlpha = 0.5;
    }

    if (attackAnim) {
      const frame = Math.floor(attackAnim.progress / 100) % 2;
      if (frame === 1) {
        this.ctx.globalAlpha *= 0.4;
      }
    }

    const unitRadius = HEX_RADIUS * 0.55;

    this.ctx.beginPath();
    this.ctx.arc(x, y, unitRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = PLAYER_COLORS[unit.player];
    this.ctx.fill();

    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `bold ${unitRadius * 0.75}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(unit.initials, x, y);

    this.drawHealthBar(x, y + unitRadius + 6, unit);

    this.ctx.restore();
  }

  private drawHealthBar(x: number, y: number, unit: HeroUnit): void {
    const barWidth = HEX_RADIUS * 1.1;
    const barHeight = 4;

    this.ctx.fillStyle = '#1A1A2E';
    this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

    const hpPercent = unit.hp / unit.maxHp;
    const hpColor = hpPercent > 0.5 ? '#22C55E' : hpPercent > 0.25 ? '#F59E0B' : '#EF4444';

    this.ctx.fillStyle = hpColor;
    this.ctx.fillRect(x - barWidth / 2, y, barWidth * hpPercent, barHeight);

    this.ctx.strokeStyle = '#2D2D44';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
  }

  private drawDeadUnit(unit: HeroUnit): void {
    if (!unit.position) return;

    const deathAnim = this.animations.find(
      a => a.type === 'death' && a.unitId === unit.id
    );

    if (!deathAnim) return;

    const t = Math.min(1, deathAnim.progress / deathAnim.duration);
    const scale = 1 - t;
    const alpha = 1 - t;

    if (alpha <= 0) return;

    const pixel = hexToPixel(unit.position.q, unit.position.r);
    const x = pixel.x + this.offsetX;
    const y = pixel.y + this.offsetY;
    const unitRadius = HEX_RADIUS * 0.55 * scale;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.ctx.arc(x, y, unitRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = PLAYER_COLORS[unit.player];
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3 * scale;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `bold ${unitRadius * 0.75}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(unit.initials, x, y);

    this.ctx.restore();
  }

  playMoveAnimation(unitId: string, from: AxialCoord, to: AxialCoord): void {
    const fromPixel = hexToPixel(from.q, from.r);
    const toPixel = hexToPixel(to.q, to.r);

    this.animations.push({
      type: 'move',
      unitId,
      fromX: fromPixel.x + this.offsetX,
      fromY: fromPixel.y + this.offsetY,
      toX: toPixel.x + this.offsetX,
      toY: toPixel.y + this.offsetY,
      progress: 0,
      duration: 300
    });
  }

  playAttackAnimation(unitId: string): void {
    this.animations.push({
      type: 'attack',
      unitId,
      progress: 0,
      duration: 300,
      frame: 0,
      maxFrames: 3
    });
  }
}
