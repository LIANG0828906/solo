import { LayoutWord, LayoutResult } from './types';

export class WordCloudRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layout: LayoutResult | null = null;
  private hoveredIndex: number = -1;
  private fadeAlpha: number = 1;
  private animationFrame: number = 0;
  private hoverAnimProgress: Map<number, number> = new Map();
  private hoverAnimFrame: number = 0;
  private onWordClick: ((index: number, x: number, y: number) => void) | null = null;
  private onWordHover: ((index: number) => void) | null = null;
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.setupListeners();
  }

  private setupListeners() {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('click', this.handleClick);
  }

  destroy() {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('click', this.handleClick);
    cancelAnimationFrame(this.animationFrame);
    cancelAnimationFrame(this.hoverAnimFrame);
  }

  setOnClick(cb: (index: number, x: number, y: number) => void) {
    this.onWordClick = cb;
  }

  setOnHover(cb: (index: number) => void) {
    this.onWordHover = cb;
  }

  setSize(width: number, height: number) {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  render(layout: LayoutResult, fade: boolean = true) {
    this.layout = layout;
    this.hoverAnimProgress.clear();
    if (fade) {
      this.fadeIn();
    } else {
      this.fadeAlpha = 1;
      this.draw();
    }
  }

  private fadeIn() {
    this.fadeAlpha = 0;
    const start = performance.now();
    cancelAnimationFrame(this.animationFrame);

    const animate = () => {
      const elapsed = performance.now() - start;
      this.fadeAlpha = Math.min(1, elapsed / 500);
      this.draw();
      if (this.fadeAlpha < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  private draw() {
    if (!this.layout) return;
    const { ctx, canvas, dpr } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.globalAlpha = this.fadeAlpha;

    for (let i = 0; i < this.layout.words.length; i++) {
      const word = this.layout.words[i];
      const isHovered = i === this.hoveredIndex;
      const progress = this.hoverAnimProgress.get(i) || 0;
      this.drawWord(word, isHovered, progress);
    }

    ctx.restore();
  }

  private drawWord(word: LayoutWord, isHovered: boolean, hoverProgress: number) {
    const { ctx } = this;
    ctx.save();

    ctx.translate(word.x, word.y);
    ctx.rotate((word.rotation * Math.PI) / 180);

    ctx.font = `bold ${word.fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = word.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (hoverProgress > 0) {
      const scale = 1 + hoverProgress * 0.05;
      ctx.scale(scale, scale);
      ctx.shadowColor = this.lightenColor(word.color, 0.4);
      ctx.shadowBlur = 12 * hoverProgress;
    }

    ctx.fillText(word.text, 0, 0);
    ctx.restore();
  }

  private lightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lr = Math.min(255, Math.round(r + (255 - r) * amount));
    const lg = Math.min(255, Math.round(g + (255 - g) * amount));
    const lb = Math.min(255, Math.round(b + (255 - b) * amount));
    return `rgb(${lr},${lg},${lb})`;
  }

  private hitTest(mx: number, my: number): number {
    if (!this.layout) return -1;
    const rect = this.canvas.getBoundingClientRect();
    const x = mx - rect.left;
    const y = my - rect.top;

    for (let i = this.layout.words.length - 1; i >= 0; i--) {
      const word = this.layout.words[i];
      const left = word.x - word.width / 2;
      const top = word.y - word.height / 2;
      if (
        x >= left &&
        x <= left + word.width &&
        y >= top &&
        y <= top + word.height
      ) {
        return i;
      }
    }
    return -1;
  }

  private handleMouseMove = (e: MouseEvent) => {
    const idx = this.hitTest(e.clientX, e.clientY);
    if (idx !== this.hoveredIndex) {
      const prevHovered = this.hoveredIndex;
      this.hoveredIndex = idx;
      this.canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';

      if (prevHovered >= 0 && prevHovered < (this.layout?.words.length || 0)) {
        this.animateHover(prevHovered, false);
      }
      if (idx >= 0) {
        this.animateHover(idx, true);
      }

      if (this.onWordHover) {
        this.onWordHover(idx);
      }
    }
  };

  private handleMouseLeave = () => {
    if (this.hoveredIndex >= 0) {
      const prev = this.hoveredIndex;
      this.hoveredIndex = -1;
      this.canvas.style.cursor = 'default';
      this.animateHover(prev, false);
    }
  };

  private handleClick = (e: MouseEvent) => {
    const idx = this.hitTest(e.clientX, e.clientY);
    if (idx >= 0 && this.onWordClick) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.onWordClick(idx, x, y);
    }
  };

  private animateHover(index: number, entering: boolean) {
    const startVal = this.hoverAnimProgress.get(index) || 0;
    const endVal = entering ? 1 : 0;
    const duration = 200;
    const start = performance.now();

    cancelAnimationFrame(this.hoverAnimFrame);

    const animate = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      this.hoverAnimProgress.set(index, current);
      this.draw();

      if (progress < 1) {
        this.hoverAnimFrame = requestAnimationFrame(animate);
      } else {
        this.hoverAnimProgress.set(index, endVal);
        if (!entering) {
          this.hoverAnimProgress.delete(index);
        }
      }
    };
    this.hoverAnimFrame = requestAnimationFrame(animate);
  }

  getCanvasDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  getWordAt(index: number): LayoutWord | null {
    if (!this.layout || index < 0 || index >= this.layout.words.length) return null;
    return this.layout.words[index];
  }

  updateWordColor(index: number, color: string) {
    if (!this.layout || index < 0 || index >= this.layout.words.length) return;
    this.layout.words[index].color = color;
    this.draw();
  }
}
