export type FontFamily = 'serif' | 'sans-serif' | 'handwriting' | 'decorative' | 'monospace';

export interface TextStyle {
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  italic: boolean;
  letterSpacing: number;
  textShadow: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  alignment: 'left' | 'center' | 'right';
}

export interface TextItem {
  id: string;
  content: string;
  style: TextStyle;
  x: number;
  y: number;
}

export interface DraggingState {
  id: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const FONT_MAP: Record<FontFamily, string> = {
  'serif': 'Georgia, "Times New Roman", Times, serif',
  'sans-serif': '"Helvetica Neue", Helvetica, Arial, sans-serif',
  'handwriting': '"Brush Script MT", "Lucida Handwriting", cursive',
  'decorative': 'Impact, "Arial Black", fantasy',
  'monospace': '"Courier New", Courier, monospace'
};

export class TextOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texts: TextItem[] = [];
  private dragging: DraggingState | null = null;
  private hoverId: string | null = null;
  private rafId: number | null = null;
  private pendingRender: boolean = false;
  private onSelectionChange?: (id: string | null) => void;
  private selectedId: string | null = null;
  private containerWidth: number = 0;
  private containerHeight: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.initDefaultTexts();
  }

  private initDefaultTexts() {
    this.texts = [
      {
        id: 'title',
        content: '你的音乐标题',
        style: {
          fontFamily: 'sans-serif',
          fontSize: 36,
          color: '#ffffff',
          fontWeight: 'bold',
          italic: false,
          letterSpacing: 0,
          textShadow: { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.5)' },
          alignment: 'center'
        },
        x: 0.5,
        y: 0.85
      },
      {
        id: 'subtitle',
        content: '副标题或艺术家名称',
        style: {
          fontFamily: 'sans-serif',
          fontSize: 20,
          color: '#cccccc',
          fontWeight: 'normal',
          italic: true,
          letterSpacing: 1,
          textShadow: { offsetX: 1, offsetY: 1, blur: 3, color: 'rgba(0,0,0,0.4)' },
          alignment: 'center'
        },
        x: 0.5,
        y: 0.92
      },
      {
        id: 'tag',
        content: '',
        style: {
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#00d4ff',
          fontWeight: 'normal',
          italic: false,
          letterSpacing: 2,
          textShadow: { offsetX: 0, offsetY: 0, blur: 0, color: 'transparent' },
          alignment: 'center'
        },
        x: 0.5,
        y: 0.78
      }
    ];
  }

  setSelectionCallback(cb: (id: string | null) => void) {
    this.onSelectionChange = cb;
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.containerWidth = width;
    this.containerHeight = height;
    this.requestRender();
  }

  getTexts(): TextItem[] {
    return this.texts.map(t => ({ ...t, style: { ...t.style, textShadow: { ...t.style.textShadow } } }));
  }

  setTexts(texts: TextItem[]) {
    this.texts = texts.map(t => ({ ...t, style: { ...t.style, textShadow: { ...t.style.textShadow } } }));
    this.requestRender();
  }

  updateText(id: string, updates: Partial<TextItem>) {
    const idx = this.texts.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.texts[idx] = {
        ...this.texts[idx],
        ...updates,
        style: updates.style ? { ...this.texts[idx].style, ...updates.style, textShadow: updates.style.textShadow ? { ...this.texts[idx].style.textShadow, ...updates.style.textShadow } : this.texts[idx].style.textShadow } : this.texts[idx].style
      };
      this.requestRender();
    }
  }

  getText(id: string): TextItem | undefined {
    const t = this.texts.find(t => t.id === id);
    if (!t) return undefined;
    return { ...t, style: { ...t.style, textShadow: { ...t.style.textShadow } } };
  }

  selectAtPoint(x: number, y: number): TextItem | null {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const text = this.texts[i];
      if (!text.content.trim()) continue;
      const bounds = this.getTextBounds(text);
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        this.selectedId = text.id;
        if (this.onSelectionChange) this.onSelectionChange(text.id);
        this.requestRender();
        return text;
      }
    }
    this.selectedId = null;
    if (this.onSelectionChange) this.onSelectionChange(null);
    this.requestRender();
    return null;
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  setSelected(id: string | null) {
    this.selectedId = id;
    if (this.onSelectionChange) this.onSelectionChange(id);
    this.requestRender();
  }

  startDrag(id: string, startX: number, startY: number) {
    const text = this.texts.find(t => t.id === id);
    if (!text) return;
    const absX = text.x * this.containerWidth;
    const absY = text.y * this.containerHeight;
    this.dragging = {
      id,
      startX,
      startY,
      offsetX: startX - absX,
      offsetY: startY - absY
    };
    this.selectedId = id;
    if (this.onSelectionChange) this.onSelectionChange(id);
  }

  moveDrag(clientX: number, clientY: number) {
    if (!this.dragging) return;
    const newX = Math.max(0, Math.min(1, (clientX - this.dragging.offsetX) / this.containerWidth));
    const newY = Math.max(0, Math.min(1, (clientY - this.dragging.offsetY) / this.containerHeight));
    const idx = this.texts.findIndex(t => t.id === this.dragging!.id);
    if (idx !== -1) {
      this.texts[idx].x = newX;
      this.texts[idx].y = newY;
      this.requestRender();
    }
  }

  endDrag() {
    this.dragging = null;
  }

  updateHover(x: number, y: number) {
    let found: string | null = null;
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const text = this.texts[i];
      if (!text.content.trim()) continue;
      const bounds = this.getTextBounds(text);
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        found = text.id;
        break;
      }
    }
    if (found !== this.hoverId) {
      this.hoverId = found;
      this.canvas.style.cursor = found ? 'move' : 'default';
    }
  }

  private getTextBounds(text: TextItem): { left: number; right: number; top: number; bottom: number } {
    this.setupContext(text.style);
    const metrics = this.ctx.measureText(text.content);
    const absX = text.x * this.containerWidth;
    const absY = text.y * this.containerHeight;
    const ascent = metrics.actualBoundingBoxAscent || text.style.fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || text.style.fontSize * 0.2;
    let left = absX - metrics.width / 2;
    if (text.style.alignment === 'left') left = absX;
    if (text.style.alignment === 'right') left = absX - metrics.width;
    const top = absY - ascent;
    return {
      left,
      right: left + metrics.width,
      top,
      bottom: absY + descent
    };
  }

  private setupContext(style: TextStyle) {
    const { ctx } = this;
    ctx.font = this.getFontString(style);
    ctx.fillStyle = style.color;
    ctx.textAlign = style.alignment;
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;

    const shadow = style.textShadow;
    if (shadow.blur > 0 || shadow.offsetX !== 0 || shadow.offsetY !== 0) {
      ctx.shadowColor = shadow.color;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
      ctx.shadowBlur = shadow.blur;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  private getFontString(style: TextStyle): string {
    const parts: string[] = [];
    if (style.italic) parts.push('italic');
    parts.push(style.fontWeight);
    parts.push(`${style.fontSize}px`);
    parts.push(FONT_MAP[style.fontFamily]);
    return parts.join(' ');
  }

  requestRender() {
    if (this.pendingRender) return;
    this.pendingRender = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }

  render() {
    const { ctx, canvas } = this;
    const cssWidth = canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    for (const text of this.texts) {
      if (!text.content.trim()) continue;
      this.setupContext(text.style);
      const absX = text.x * this.containerWidth;
      const absY = text.y * this.containerHeight;
      ctx.fillText(text.content, absX, absY);
    }

    if (this.selectedId) {
      const t = this.texts.find(t => t.id === this.selectedId);
      if (t && t.content.trim()) {
        this.renderSelectionBox(t);
      }
    }
  }

  private renderSelectionBox(text: TextItem) {
    const bounds = this.getTextBounds(text);
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = '#00d4ff';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeRect(bounds.left - 6, bounds.top - 6, bounds.right - bounds.left + 12, bounds.bottom - bounds.top + 12);
    ctx.restore();
  }

  drawToContext(targetCtx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    targetCtx.drawImage(this.canvas, x, y, width, height);
  }

  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  static getFontFamilyValue(ff: FontFamily): string {
    return FONT_MAP[ff];
  }
}
