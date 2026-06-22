import { HexGrid, HexCoord } from './grid';
import { UnitData, isAlive } from './unit';
import { EffectsSystem } from './effects';

const SQRT3 = Math.sqrt(3);

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  grid: HexGrid;
  effects: EffectsSystem;

  offsetX = 0;
  offsetY = 0;
  scale = 1;

  reachableHexes: HexCoord[] = [];
  skillRangeHexes: HexCoord[] = [];
  deployHighlight: { hex: HexCoord; valid: boolean } | null = null;
  selectedUnitId: string | null = null;
  hoveredHex: HexCoord | null = null;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private dpr = 1;

  constructor(canvas: HTMLCanvasElement, grid: HexGrid, effects: EffectsSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.grid = grid;
    this.effects = effects;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  centerGrid(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    const gw = this.grid.getGridWidth();
    const gh = this.grid.getGridHeight();
    this.scale = Math.min(
      (rect.width - 80) / gw,
      (rect.height - 80) / gh,
      1.5
    );
    this.offsetX = (rect.width - gw * this.scale) / 2;
    this.offsetY = (rect.height - gh * this.scale) / 2;
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (sx - rect.left);
    const cy = (sy - rect.top);
    return {
      x: (cx - this.offsetX) / this.scale,
      y: (cy - this.offsetY) / this.scale
    };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY
    };
  }

  screenToHex(sx: number, sy: number): HexCoord {
    const w = this.screenToWorld(sx, sy);
    const approx = this.grid.pixelToHex(w.x, w.y);
    let best = approx;
    let bestDist = Infinity;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const c = { col: approx.col + dc, row: approx.row + dr };
        if (!this.grid.isValid(c)) continue;
        const p = this.grid.hexToPixel(c.col, c.row);
        const dist = Math.hypot(p.x - w.x, p.y - w.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
    }
    if (bestDist > this.grid.hexSize * SQRT3 * 0.6) {
      return { col: -1, row: -1 };
    }
    return best;
  }

  initInputHandlers(): void {
    const canvas = this.canvas;

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const oldScale = this.scale;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale = Math.max(0.4, Math.min(3, this.scale * delta));
      const ratio = this.scale / oldScale;
      this.offsetX = mx - (mx - this.offsetX) * ratio;
      this.offsetY = my - (my - this.offsetY) * ratio;
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragOffsetX = this.offsetX;
        this.dragOffsetY = this.offsetY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.offsetX = this.dragOffsetX + (e.clientX - this.dragStartX);
        this.offsetY = this.dragOffsetY + (e.clientY - this.dragStartY);
      } else {
        const hex = this.screenToHex(e.clientX, e.clientY);
        this.hoveredHex = this.grid.isValid(hex) ? hex : null;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        canvas.style.cursor = 'default';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      this.hoveredHex = null;
      this.isDragging = false;
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  draw(units: UnitData[], time: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawGrid(ctx, time);
    this.drawHighlights(ctx);
    this.drawUnits(ctx, units, time);
    this.effects.draw(ctx);

    ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D, time: number): void {
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const p = this.grid.hexToPixel(col, row);
        const corners = this.grid.getHexCorners(p.x, p.y);

        ctx.strokeStyle = 'rgba(60, 70, 90, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) {
          ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        const dotAlpha = 0.15 + 0.08 * Math.sin(time * 1.5 + col * 0.7 + row * 0.5);
        ctx.fillStyle = `rgba(100, 160, 220, ${dotAlpha})`;
        for (const c of corners) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawHighlights(ctx: CanvasRenderingContext2D): void {
    if (this.deployHighlight) {
      const { hex, valid } = this.deployHighlight;
      this.drawHexFill(ctx, hex, valid ? 'rgba(0, 255, 100, 0.2)' : 'rgba(255, 60, 60, 0.2)');
      this.drawHexBorder(ctx, hex, valid ? 'rgba(0, 255, 100, 0.5)' : 'rgba(255, 60, 60, 0.5)', 2);
    }

    for (const hex of this.reachableHexes) {
      this.drawHexFill(ctx, hex, 'rgba(0, 212, 255, 0.12)');
      this.drawHexBorder(ctx, hex, 'rgba(0, 212, 255, 0.3)', 1.5);
    }

    for (const hex of this.skillRangeHexes) {
      this.drawHexFill(ctx, hex, 'rgba(0, 212, 255, 0.18)');
      this.drawHexBorder(ctx, hex, 'rgba(0, 212, 255, 0.45)', 2);
    }

    if (this.hoveredHex && this.grid.isValid(this.hoveredHex)) {
      this.drawHexFill(ctx, this.hoveredHex, 'rgba(200, 220, 255, 0.06)');
    }
  }

  private drawHexFill(ctx: CanvasRenderingContext2D, hex: HexCoord, color: string): void {
    const p = this.grid.hexToPixel(hex.col, hex.row);
    const corners = this.grid.getHexCorners(p.x, p.y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fill();
  }

  private drawHexBorder(ctx: CanvasRenderingContext2D, hex: HexCoord, color: string, width: number): void {
    const p = this.grid.hexToPixel(hex.col, hex.row);
    const corners = this.grid.getHexCorners(p.x, p.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.stroke();
  }

  private drawUnits(ctx: CanvasRenderingContext2D, units: UnitData[], time: number): void {
    for (const unit of units) {
      if (!isAlive(unit)) continue;
      this.drawUnit(ctx, unit, time);
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, unit: UnitData, time: number): void {
    const p = this.grid.hexToPixel(unit.col, unit.row);
    const isSelected = unit.id === this.selectedUnitId;
    const isPlayer = unit.team === 'player';
    const baseColor = isPlayer ? '#4488ff' : '#ff4444';
    const glowColor = isPlayer ? 'rgba(68, 136, 255,' : 'rgba(255, 68, 68,';

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.5 + p.x * 0.01);
    const r = this.grid.hexSize * 0.58;

    ctx.save();

    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 6 + pulse * 6;
    ctx.fillStyle = glowColor + '0.08)';
    this.drawRoundedHex(ctx, p.x, p.y, r + 6 + pulse * 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    const grad = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, 0, p.x, p.y, r);
    if (isPlayer) {
      grad.addColorStop(0, '#6699ff');
      grad.addColorStop(0.6, '#3366dd');
      grad.addColorStop(1, '#2244aa');
    } else {
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(0.6, '#dd3333');
      grad.addColorStop(1, '#aa2222');
    }
    ctx.fillStyle = grad;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 8;
    this.drawRoundedHex(ctx, p.x, p.y, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = glowColor + '0.5)';
    ctx.lineWidth = 1.5;
    this.drawRoundedHex(ctx, p.x, p.y, r);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 0.7)}px 'Exo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.icon, p.x, p.y - 1);

    const barW = r * 1.6;
    const barH = 4;
    const barY = p.y + r * 0.55;
    const hpRatio = unit.hp / unit.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(p.x - barW / 2, barY, barW, barH, 2);
    ctx.fill();

    const hpColor = hpRatio > 0.5 ? '#44dd66' : hpRatio > 0.25 ? '#ddaa22' : '#dd3333';
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(p.x - barW / 2, barY, barW * hpRatio, barH, 2);
    ctx.fill();

    if (unit.shield > 0) {
      const shieldY = barY + barH + 1;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(p.x - barW / 2, shieldY, barW, 3, 1.5);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.roundRect(p.x - barW / 2, shieldY, barW * Math.min(1, unit.shield / unit.maxHp), 3, 1.5);
      ctx.fill();
    }

    if (isSelected) {
      const auraAngle = time * 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(auraAngle);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.rotate(-auraAngle * 1.5);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r + 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawRoundedHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    const cornerRadius = r * 0.25;
    const corners = this.grid.getHexCorners(cx, cy);
    const scale = r / this.grid.hexSize;
    const scaledCorners = corners.map(c => ({
      x: cx + (c.x - cx) * scale,
      y: cy + (c.y - cy) * scale
    }));

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const curr = scaledCorners[i];
      const next = scaledCorners[(i + 1) % 6];
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.hypot(dx, dy);
      const t = Math.min(cornerRadius / len, 0.4);

      const startX = curr.x + dx * t;
      const startY = curr.y + dy * t;
      const endX = next.x - dx * t;
      const endY = next.y - dy * t;

      if (i === 0) {
        ctx.moveTo(startX, startY);
      } else {
        ctx.lineTo(startX, startY);
      }
      ctx.quadraticCurveTo(next.x, next.y, endX, endY);
    }
    ctx.closePath();
  }
}
