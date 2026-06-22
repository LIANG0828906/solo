import { useCanvasStore } from './store';
import { applyFilter } from './filters';
import type { EmojiItem, FilterType } from './types';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private needsRedraw: boolean = true;
  private draggingEmojiId: string | null = null;
  private dragScale: number = 1;
  private ringMenuEmojiId: string | null = null;
  private ringMenuX: number = 0;
  private ringMenuY: number = 0;
  private ringMenuProgress: number = 0;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (!offCtx) throw new Error('Cannot get offscreen 2D context');
    this.offscreenCtx = offCtx;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    useCanvasStore.subscribe(() => {
      this.scheduleRedraw();
    });
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.offscreenCanvas.width = rect.width * dpr;
    this.offscreenCanvas.height = rect.height * dpr;
    this.offscreenCtx.scale(dpr, dpr);

    this.scheduleRedraw();
  }

  scheduleRedraw(): void {
    this.needsRedraw = true;
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame((t) => this.renderLoop(t));
    }
  }

  setDraggingEmoji(id: string | null, scale: number = 1): void {
    this.draggingEmojiId = id;
    this.dragScale = scale;
    this.scheduleRedraw();
  }

  setRingMenu(emojiId: string | null, x: number, y: number, progress: number = 0): void {
    this.ringMenuEmojiId = emojiId;
    this.ringMenuX = x;
    this.ringMenuY = y;
    this.ringMenuProgress = progress;
    this.scheduleRedraw();
  }

  private renderLoop(time: number): void {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (this.needsRedraw) {
      this.render();
      this.needsRedraw = false;
    }

    if (this.ringMenuProgress > 0 && this.ringMenuProgress < 1) {
      this.ringMenuProgress = Math.min(1, this.ringMenuProgress + deltaTime / 200);
      this.needsRedraw = true;
    }

    if (this.needsRedraw) {
      this.animationFrameId = requestAnimationFrame((t) => this.renderLoop(t));
    } else {
      this.animationFrameId = null;
    }
  }

  private render(): void {
    const state = useCanvasStore.getState();
    const { viewport, emojis, currentFilter } = state;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, width, height);

    this.drawGrid(width, height, viewport);

    this.ctx.save();
    this.ctx.translate(viewport.offsetX, viewport.offsetY);
    this.ctx.scale(viewport.scale, viewport.scale);

    const sortedEmojis = [...emojis].sort((a, b) => a.zIndex - b.zIndex);

    for (const emoji of sortedEmojis) {
      if (emoji.id === this.draggingEmojiId) continue;
      this.drawEmoji(emoji);
    }

    if (this.draggingEmojiId) {
      const draggingEmoji = emojis.find((e) => e.id === this.draggingEmojiId);
      if (draggingEmoji) {
        this.drawEmoji(draggingEmoji, this.dragScale);
      }
    }

    this.ctx.restore();

    if (currentFilter !== 'none') {
      this.applyFilterToCanvas(width, height, currentFilter);
    }

    if (this.ringMenuEmojiId && this.ringMenuProgress > 0) {
      this.drawRingMenu(this.ringMenuX, this.ringMenuY, this.ringMenuProgress);
    }
  }

  private drawGrid(width: number, height: number, viewport: { offsetX: number; offsetY: number; scale: number }): void {
    const gridSize = 50 * viewport.scale;
    if (gridSize < 15) return;

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    this.ctx.lineWidth = 1;

    const startX = viewport.offsetX % gridSize;
    const startY = viewport.offsetY % gridSize;

    for (let x = startX; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let y = startY; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  private drawEmoji(emoji: EmojiItem, scaleMultiplier: number = 1): void {
    const size = emoji.size * scaleMultiplier;

    this.ctx.save();
    this.ctx.translate(emoji.x, emoji.y);

    if (scaleMultiplier !== 1) {
      const springScale = this.springScale(scaleMultiplier);
      this.ctx.scale(springScale, springScale);
    }

    this.ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (emoji.color && emoji.color !== '') {
      const tempCanvas = document.createElement('canvas');
      const dpr = 2;
      tempCanvas.width = size * dpr;
      tempCanvas.height = size * dpr;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.scale(dpr, dpr);
        tempCtx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(emoji.emoji, size / 2, size / 2);

        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = emoji.color;
        tempCtx.globalAlpha = 0.85;
        tempCtx.fillRect(0, 0, size, size);
      }

      this.ctx.drawImage(tempCanvas, -size / 2, -size / 2, size, size);
    } else {
      this.ctx.fillText(emoji.emoji, 0, 0);
    }

    this.ctx.restore();
  }

  private springScale(targetScale: number): number {
    const t = (targetScale - 1) / 0.2;
    const eased = 1 - Math.pow(1 - t, 3);
    return 1 + eased * 0.2;
  }

  private drawRingMenu(x: number, y: number, progress: number): void {
    const radius = 80;
    const itemRadius = 30;
    const items = [
      { icon: '🗑️', label: '删除', id: 'delete' },
      { icon: '📋', label: '复制', id: 'duplicate' },
      { icon: '📏', label: '大小', id: 'resize' },
      { icon: '🎨', label: '颜色', id: 'color' }
    ];

    this.ctx.save();

    const displayProgress = Math.min(1, progress * 2);

    for (let i = 0; i < items.length; i++) {
      const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
      const itemProgress = Math.max(0, Math.min(1, (progress - i * 0.1) * 2));

      if (itemProgress <= 0) continue;

      const itemX = x + Math.cos(angle) * radius * itemProgress;
      const itemY = y + Math.sin(angle) * radius * itemProgress;

      const startAngle = angle - 0.4;
      const endAngle = angle + 0.4;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.arc(x, y, radius * itemProgress, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * itemProgress})`;
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 * itemProgress})`;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.font = `${itemRadius}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.globalAlpha = itemProgress;
      this.ctx.fillText(items[i]!.icon, itemX, itemY);
      this.ctx.globalAlpha = 1;
    }

    this.ctx.beginPath();
    this.ctx.arc(x, y, 20 * displayProgress, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * displayProgress})`;
    this.ctx.fill();
    this.ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * displayProgress})`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  private applyFilterToCanvas(width: number, height: number, filter: FilterType): void {
    const dpr = window.devicePixelRatio || 1;
    this.offscreenCtx.clearRect(0, 0, width, height);
    this.offscreenCtx.drawImage(this.canvas, 0, 0, width * dpr, height * dpr, 0, 0, width, height);

    const imageData = this.offscreenCtx.getImageData(0, 0, Math.floor(width), Math.floor(height));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.floor(width);
    tempCanvas.height = Math.floor(height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);
    applyFilter(tempCtx, Math.floor(width), Math.floor(height), filter);

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  getCanvasDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', () => this.resize());
  }
}
