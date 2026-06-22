import { TerrainBlock, TerrainType, TerrainBlockData, TERRAIN_COLORS } from './terrainBlock';
import { PhysicsEngine } from '../physics/physicsEngine';

export const GRID_SIZE = 40;

export class EditorManager {
  private canvas: HTMLCanvasElement | null = null;
  private physics: PhysicsEngine | null = null;

  public blocks: TerrainBlock[] = [];
  public selectedType: TerrainType = 'movingPlatform';
  public selectedBlockId: string | null = null;

  private mouseX = 0;
  private mouseY = 0;
  private isDraggingNew = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragWidth = 0;
  private dragHeight = 0;

  private hoverBlockId: string | null = null;

  private onSelectionChanged?: (block: TerrainBlock | null) => void;

  public init(canvas: HTMLCanvasElement, physicsEngine: PhysicsEngine): void {
    this.canvas = canvas;
    this.physics = physicsEngine;
    this.bindEvents();
    this.syncPhysics();
  }

  public setSelectionCallback(cb: (block: TerrainBlock | null) => void): void {
    this.onSelectionChanged = cb;
  }

  public syncPhysics(): void {
    if (this.physics) {
      this.physics.setTerrain(this.blocks);
    }
  }

  public setSelectedType(t: TerrainType): void {
    this.selectedType = t;
    this.selectedBlockId = null;
    if (this.onSelectionChanged) this.onSelectionChanged(null);
  }

  public addBlock(type: TerrainType, x: number, y: number, w?: number, h?: number): TerrainBlock {
    const width = w ?? (type === 'brickWall' ? 80 : 160);
    const height = h ?? (type === 'brickWall' ? 80 : 20);
    const block = new TerrainBlock({
      id: `b_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`,
      type,
      x: this.snap(x) - width / 2,
      y: this.snap(y) - height / 2,
      width,
      height,
    });
    this.blocks.push(block);
    this.syncPhysics();
    return block;
  }

  public removeBlock(id: string): void {
    this.blocks = this.blocks.filter(b => b.id !== id);
    if (this.selectedBlockId === id) {
      this.selectedBlockId = null;
      if (this.onSelectionChanged) this.onSelectionChanged(null);
    }
    this.syncPhysics();
  }

  public clearAll(): void {
    this.blocks = [];
    this.selectedBlockId = null;
    if (this.onSelectionChanged) this.onSelectionChanged(null);
    this.syncPhysics();
  }

  public getSelectedBlock(): TerrainBlock | null {
    return this.blocks.find(b => b.id === this.selectedBlockId) ?? null;
  }

  public selectBlock(id: string | null): void {
    this.selectedBlockId = id;
    const b = id ? this.blocks.find(x => x.id === id) ?? null : null;
    if (this.onSelectionChanged) this.onSelectionChanged(b);
  }

  public applyParamChange(update: (b: TerrainBlock) => void): void {
    const b = this.getSelectedBlock();
    if (!b) return;
    update(b);
    if (b.type === 'movingPlatform') b.refreshBase();
    this.syncPhysics();
  }

  private snap(v: number): number {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
  }

  private toLocal(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  }

  private pickBlock(x: number, y: number): TerrainBlock | null {
    for (let i = this.blocks.length - 1; i >= 0; i -= 1) {
      const b = this.blocks[i];
      if (b.destroyed) continue;
      if (b.contains(x, y)) return b;
    }
    return null;
  }

  private bindEvents(): void {
    const c = this.canvas;
    if (!c) return;

    c.addEventListener('mousemove', (e) => {
      const p = this.toLocal(e.clientX, e.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;

      if (this.isDraggingNew) {
        this.dragWidth = Math.max(GRID_SIZE, Math.abs(this.snap(p.x) - this.dragStartX));
        this.dragHeight = Math.max(GRID_SIZE / 2, Math.abs(this.snap(p.y) - this.dragStartY));
      } else {
        const hb = this.pickBlock(p.x, p.y);
        this.hoverBlockId = hb ? hb.id : null;
      }
    });

    c.addEventListener('mousedown', (e) => {
      const p = this.toLocal(e.clientX, e.clientY);

      if (e.button === 2) {
        const b = this.pickBlock(p.x, p.y);
        if (b) this.removeBlock(b.id);
        return;
      }

      if (e.button !== 0) return;

      const b = this.pickBlock(p.x, p.y);
      if (b) {
        this.selectBlock(b.id);
        return;
      }

      this.selectBlock(null);
      this.isDraggingNew = true;
      this.dragStartX = this.snap(p.x);
      this.dragStartY = this.snap(p.y);
      this.dragWidth = this.selectedType === 'brickWall' ? 80 : 160;
      this.dragHeight = this.selectedType === 'brickWall' ? 80 : 20;
    });

    c.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      if (!this.isDraggingNew) return;
      this.isDraggingNew = false;

      const cx = (this.dragStartX + this.snap(this.mouseX)) / 2;
      const cy = (this.dragStartY + this.snap(this.mouseY)) / 2;

      this.addBlock(
        this.selectedType,
        cx,
        cy,
        Math.max(GRID_SIZE, this.snap(Math.abs(this.snap(this.mouseX) - this.dragStartX)) || (this.selectedType === 'brickWall' ? 80 : 160)),
        Math.max(GRID_SIZE / 2, this.snap(Math.abs(this.snap(this.mouseY) - this.dragStartY)) || (this.selectedType === 'brickWall' ? 80 : 20)),
      );
    });

    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public updateTerrain(deltaTime: number, running: boolean): void {
    for (const b of this.blocks) {
      b.update(deltaTime, running);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.drawGrid(ctx);

    for (const b of this.blocks) {
      this.drawBlock(ctx, b);
    }

    if (this.isDraggingNew) {
      this.drawPreview(ctx);
    } else if (this.mouseX >= 0 && this.mouseY >= 0 && !this.hoverBlockId) {
      this.drawGhost(ctx);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    if (!this.canvas) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.beginPath();
    for (let x = 0; x <= w; x += GRID_SIZE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += GRID_SIZE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(100, 100, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,255,255,0.6)';
    ctx.font = '11px Consolas, monospace';
    ctx.fillText('起点 (SPAWN)', 112, 104);

    ctx.restore();
  }

  private drawBlock(ctx: CanvasRenderingContext2D, b: TerrainBlock): void {
    if (b.destroyed) return;
    const color = TERRAIN_COLORS[b.type];
    const selected = b.id === this.selectedBlockId;
    const hovered = b.id === this.hoverBlockId;

    ctx.save();

    ctx.shadowColor = color;
    ctx.shadowBlur = hovered || selected ? 18 : 10;
    ctx.fillStyle = color;
    roundRect(ctx, b.x, b.y, b.width, b.height, 4);
    ctx.fill();

    ctx.shadowBlur = 0;

    if (b.type === 'conveyor') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const arrowY = b.y + b.height / 2;
      const step = 24;
      const start = b.x + 8;
      for (let x = start; x < b.x + b.width - 8; x += step) {
        const dir = b.conveyorDirection;
        ctx.moveTo(x, arrowY);
        ctx.lineTo(x + dir * 12, arrowY);
        ctx.moveTo(x + dir * 12, arrowY);
        ctx.lineTo(x + dir * 7, arrowY - 4);
        ctx.moveTo(x + dir * 12, arrowY);
        ctx.lineTo(x + dir * 7, arrowY + 4);
      }
      ctx.stroke();
    } else if (b.type === 'movingPlatform') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      if (b.moveAxis === 'x') {
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy);
        ctx.lineTo(cx + 16, cy);
        ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 11, cy - 4);
        ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 11, cy + 4);
        ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + 11, cy - 4);
        ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + 11, cy + 4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.moveTo(cx, cy - 10); ctx.lineTo(cx - 4, cy - 5);
        ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 4, cy - 5);
        ctx.moveTo(cx, cy + 10); ctx.lineTo(cx - 4, cy + 5);
        ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 4, cy + 5);
        ctx.stroke();
      }
    } else if (b.type === 'brickWall') {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      const rows = Math.max(1, Math.floor(b.height / 20));
      const cols = Math.max(1, Math.floor(b.width / 40));
      const rh = b.height / rows;
      const cw = b.width / cols;
      for (let r = 0; r < rows; r += 1) {
        for (let col = 0; col < cols; col += 1) {
          const ox = r % 2 === 0 ? 0 : cw / 2;
          const bx = b.x + col * cw + ox;
          const by = b.y + r * rh;
          if (bx + cw / 2 < b.x + b.width) {
            ctx.strokeRect(bx, by, cw - 1, rh - 1);
          }
        }
      }
      if (b.health > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 11px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${b.health}`, b.x + b.width / 2, b.y + b.height / 2 + 4);
        ctx.textAlign = 'start';
      }
    }

    if (selected) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      roundRect(ctx, b.x - 3, b.y - 3, b.width + 6, b.height + 6, 5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private drawPreview(ctx: CanvasRenderingContext2D): void {
    const color = TERRAIN_COLORS[this.selectedType];
    const w = Math.max(GRID_SIZE, this.dragWidth);
    const h = Math.max(GRID_SIZE / 2, this.dragHeight);
    const x = Math.min(this.dragStartX, this.snap(this.mouseX));
    const y = Math.min(this.dragStartY, this.snap(this.mouseY));
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.restore();
  }

  private drawGhost(ctx: CanvasRenderingContext2D): void {
    const color = TERRAIN_COLORS[this.selectedType];
    const w = this.selectedType === 'brickWall' ? 80 : 160;
    const h = this.selectedType === 'brickWall' ? 80 : 20;
    const x = this.snap(this.mouseX) - w / 2;
    const y = this.snap(this.mouseY) - h / 2;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.restore();
  }

  public serialize(): string {
    const data = {
      version: 1,
      blocks: this.blocks.map(b => b.serialize()),
    };
    return JSON.stringify(data, null, 2);
  }

  public deserialize(json: string): void {
    try {
      const data = JSON.parse(json);
      if (!data || !Array.isArray(data.blocks)) throw new Error('invalid format');
      const loaded: TerrainBlock[] = [];
      for (const bd of data.blocks as TerrainBlockData[]) {
        const b = new TerrainBlock(bd);
        if (b.type === 'movingPlatform') b.refreshBase();
        loaded.push(b);
      }
      this.blocks = loaded;
      this.selectedBlockId = null;
      if (this.onSelectionChanged) this.onSelectionChanged(null);
      this.syncPhysics();
    } catch (err) {
      console.error('导入失败:', err);
      throw err;
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
