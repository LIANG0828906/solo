import {
  Level,
  LevelElement,
  ElementType,
  pointInRect,
  generateId,
} from './level';

export const GRID_SIZE = 32;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

export interface EditorTool {
  type: ElementType | null;
  defaultWidth: number;
  defaultHeight: number;
}

export const TOOLS: Record<ElementType, EditorTool> = {
  ground: { type: 'ground', defaultWidth: 128, defaultHeight: 32 },
  platform: { type: 'platform', defaultWidth: 96, defaultHeight: 16 },
  spike: { type: 'spike', defaultWidth: 32, defaultHeight: 32 },
  flag: { type: 'flag', defaultWidth: 24, defaultHeight: 48 },
  'enemy-patrol': { type: 'enemy-patrol', defaultWidth: 28, defaultHeight: 28 },
  'enemy-jump': { type: 'enemy-jump', defaultWidth: 28, defaultHeight: 28 },
};

const ELEMENT_COLORS: Record<ElementType, { fill: string; stroke: string; label: string }> = {
  ground: { fill: '#8b5a2b', stroke: '#6b4420', label: '地面' },
  platform: { fill: '#4a8c3f', stroke: '#356828', label: '平台' },
  spike: { fill: '#d94a4a', stroke: '#a03030', label: '尖刺' },
  flag: { fill: '#ffcc00', stroke: '#cc9900', label: '旗帜' },
  'enemy-patrol': { fill: '#d94a6a', stroke: '#a03050', label: '巡逻敌' },
  'enemy-jump': { fill: '#9b59b6', stroke: '#6b3a80', label: '跳跃敌' },
};

export class Editor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private level: Level;
  private selectedTool: ElementType | null = null;
  private selectedElementId: string | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private onSelectionChange: (id: string | null) => void = () => {};
  private onLevelChange: () => void = () => {};
  platformWidth: number = 96;
  platformHeight: number = 16;

  constructor(canvas: HTMLCanvasElement, level: Level) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.level = level;
    this.bindEvents();
  }

  setSelectedTool(tool: ElementType | null): void {
    this.selectedTool = tool;
    this.selectedElementId = null;
    this.onSelectionChange(null);
  }

  setSelectionCallback(cb: (id: string | null) => void): void {
    this.onSelectionChange = cb;
  }

  setLevelChangeCallback(cb: () => void): void {
    this.onLevelChange = cb;
  }

  getSelectedElement(): LevelElement | undefined {
    if (!this.selectedElementId) return undefined;
    return this.level.getElementById(this.selectedElementId);
  }

  updateSelectedElement(props: Partial<LevelElement>): void {
    const el = this.getSelectedElement();
    if (!el) return;
    Object.assign(el, props);
    this.onLevelChange();
  }

  deleteSelected(): void {
    if (!this.selectedElementId) return;
    this.level.removeElement(this.selectedElementId);
    this.selectedElementId = null;
    this.onSelectionChange(null);
    this.onLevelChange();
  }

  private bindEvents(): void {
    const c = this.canvas;
    c.addEventListener('mousemove', this.onMouseMove);
    c.addEventListener('mousedown', this.onMouseDown);
    c.addEventListener('mouseup', this.onMouseUp);
    c.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('keydown', this.onKeyDown);
  }

  destroy(): void {
    const c = this.canvas;
    c.removeEventListener('mousemove', this.onMouseMove);
    c.removeEventListener('mousedown', this.onMouseDown);
    c.removeEventListener('mouseup', this.onMouseUp);
    c.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private getCanvasMouse(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private snap(value: number): number {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  private onMouseMove = (e: MouseEvent): void => {
    const pos = this.getCanvasMouse(e);
    this.mouseX = pos.x;
    this.mouseY = pos.y;

    if (this.isDragging && this.selectedElementId) {
      const el = this.level.getElementById(this.selectedElementId);
      if (el) {
        el.x = this.snap(pos.x - this.dragOffsetX);
        el.y = this.snap(pos.y - this.dragOffsetY);
        el.x = Math.max(0, Math.min(CANVAS_WIDTH - el.width, el.x));
        el.y = Math.max(0, Math.min(CANVAS_HEIGHT - el.height, el.y));
      }
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    const pos = this.getCanvasMouse(e);

    for (let i = this.level.elements.length - 1; i >= 0; i--) {
      const el = this.level.elements[i];
      if (pointInRect(pos.x, pos.y, el)) {
        this.selectedElementId = el.id;
        this.isDragging = true;
        this.dragOffsetX = pos.x - el.x;
        this.dragOffsetY = pos.y - el.y;
        this.onSelectionChange(el.id);
        return;
      }
    }

    if (this.selectedTool) {
      this.placeElement(pos.x, pos.y);
    } else {
      this.selectedElementId = null;
      this.onSelectionChange(null);
    }
  };

  private onMouseUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      this.onLevelChange();
    }
  };

  private onMouseLeave = (): void => {
    this.isDragging = false;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selectedElementId) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        this.deleteSelected();
      }
    }
  };

  private placeElement(mx: number, my: number): void {
    if (!this.selectedTool) return;
    const tool = TOOLS[this.selectedTool];
    let w = tool.defaultWidth;
    let h = tool.defaultHeight;

    if (this.selectedTool === 'platform') {
      w = Math.max(GRID_SIZE, this.platformWidth);
      h = Math.max(GRID_SIZE / 2, this.platformHeight);
    }

    const x = this.snap(mx - w / 2);
    const y = this.snap(my - h / 2);

    const el: LevelElement = {
      id: generateId(),
      type: this.selectedTool,
      x: Math.max(0, Math.min(CANVAS_WIDTH - w, x)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT - h, y)),
      width: w,
      height: h,
    };

    this.level.addElement(el);
    this.selectedElementId = el.id;
    this.onSelectionChange(el.id);
    this.onLevelChange();
  }

  draw(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid();

    for (const el of this.level.elements) {
      this.drawElement(el, false);
    }

    if (this.selectedElementId) {
      const el = this.level.getElementById(this.selectedElementId);
      if (el) this.drawSelectionOutline(el);
    }

    if (this.selectedTool && !this.isDragging) {
      this.drawPreview();
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(CANVAS_WIDTH, y + 0.5);
      ctx.stroke();
    }
  }

  private drawElement(el: LevelElement, preview: boolean): void {
    const ctx = this.ctx;
    const colors = ELEMENT_COLORS[el.type];
    ctx.save();
    if (preview) ctx.globalAlpha = 0.5;

    switch (el.type) {
      case 'ground':
        this.drawGround(ctx, el);
        break;
      case 'platform':
        this.drawPlatform(ctx, el);
        break;
      case 'spike':
        this.drawSpike(ctx, el);
        break;
      case 'flag':
        this.drawFlag(ctx, el);
        break;
      case 'enemy-patrol':
        this.drawPatrolEnemy(ctx, el);
        break;
      case 'enemy-jump':
        this.drawJumpEnemy(ctx, el);
        break;
      default:
        ctx.fillStyle = colors.fill;
        ctx.fillRect(el.x, el.y, el.width, el.height);
    }

    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(el.x, el.y, el.width, el.height);
    ctx.fillStyle = '#5fa04a';
    ctx.fillRect(el.x, el.y, el.width, Math.min(8, el.height));

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < el.width; i += 16) {
      ctx.fillRect(el.x + i, el.y + 10 + ((i / 16) % 2) * 6, 8, 4);
    }

    ctx.strokeStyle = '#6b4420';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(el.x + 0.5, el.y + 0.5, el.width - 1, el.height - 1);
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    const grad = ctx.createLinearGradient(el.x, el.y, el.x, el.y + el.height);
    grad.addColorStop(0, '#6abf55');
    grad.addColorStop(1, '#4a8c3f');
    ctx.fillStyle = grad;
    ctx.fillRect(el.x, el.y, el.width, el.height);

    ctx.strokeStyle = '#356828';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(el.x + 0.5, el.y + 0.5, el.width - 1, el.height - 1);
  }

  private drawSpike(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    const count = Math.max(1, Math.floor(el.width / 16));
    const spikeW = el.width / count;

    for (let i = 0; i < count; i++) {
      ctx.fillStyle = '#d94a4a';
      ctx.beginPath();
      ctx.moveTo(el.x + i * spikeW, el.y + el.height);
      ctx.lineTo(el.x + i * spikeW + spikeW / 2, el.y);
      ctx.lineTo(el.x + (i + 1) * spikeW, el.y + el.height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#a03030';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  private drawFlag(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    ctx.fillStyle = '#555';
    ctx.fillRect(el.x + el.width / 2 - 2, el.y, 4, el.height);

    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(el.x + el.width / 2 + 2, el.y + 4);
    ctx.lineTo(el.x + el.width / 2 + 22, el.y + 12);
    ctx.lineTo(el.x + el.width / 2 + 2, el.y + 20);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawPatrolEnemy(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.fillStyle = '#d94a6a';
    ctx.beginPath();
    ctx.arc(cx, cy, el.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 4, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 2, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawJumpEnemy(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    const cx = el.x + el.width / 2;
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.moveTo(cx, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height);
    ctx.lineTo(el.x, el.y + el.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 4, el.y + el.height - 8, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, el.y + el.height - 8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - 4, el.y + el.height - 8, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 4, el.y + el.height - 8, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPreview(): void {
    if (!this.selectedTool) return;
    const tool = TOOLS[this.selectedTool];
    let w = tool.defaultWidth;
    let h = tool.defaultHeight;
    if (this.selectedTool === 'platform') {
      w = Math.max(GRID_SIZE, this.platformWidth);
      h = Math.max(GRID_SIZE / 2, this.platformHeight);
    }

    const previewEl: LevelElement = {
      id: 'preview',
      type: this.selectedTool,
      x: this.snap(this.mouseX - w / 2),
      y: this.snap(this.mouseY - h / 2),
      width: w,
      height: h,
    };
    this.drawElement(previewEl, true);
  }

  private drawSelectionOutline(el: LevelElement): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4);
    ctx.setLineDash([]);

    ctx.fillStyle = '#4a90d9';
    const handleSize = 6;
    const corners = [
      [el.x, el.y],
      [el.x + el.width, el.y],
      [el.x, el.y + el.height],
      [el.x + el.width, el.y + el.height],
    ];
    for (const [hx, hy] of corners) {
      ctx.fillRect(hx - handleSize / 2 - 2, hy - handleSize / 2 - 2, handleSize, handleSize);
    }
  }
}
