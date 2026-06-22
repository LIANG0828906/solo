import { useCanvasStore, ColorBlock } from '@/store/canvasStore';
import {
  RGB,
  rgbToString,
  easeOutCubic,
  easeInCubic,
  lerpRgb,
} from '@/utils/colorUtils';

const APPEAR_DURATION = 300;
const DISAPPEAR_DURATION = 800;
const TRAIL_DELAY = 200;

interface PositionHistory {
  x: number;
  y: number;
  timestamp: number;
}

export interface CanvasRendererOptions {
  getMousePosition: () => { x: number; y: number } | null;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private running: boolean = false;
  private positionHistory: Map<string, PositionHistory[]> = new Map();
  private getMousePosition: CanvasRendererOptions['getMousePosition'];
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.getMousePosition = options.getMousePosition;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = () => {
    if (!this.running) return;
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private updatePositionHistory(blocks: ColorBlock[], now: number) {
    for (const block of blocks) {
      if (block.isDragging) {
        let history = this.positionHistory.get(block.id);
        if (!history) {
          history = [];
          this.positionHistory.set(block.id, history);
        }
        history.push({ x: block.x, y: block.y, timestamp: now });
        while (history.length > 0 && now - history[0].timestamp > TRAIL_DELAY + 50) {
          history.shift();
        }
      } else {
        this.positionHistory.delete(block.id);
      }
    }
    for (const [id] of Array.from(this.positionHistory.entries())) {
      if (!blocks.find((b) => b.id === id)) {
        this.positionHistory.delete(id);
      }
    }
  }

  private getBlockDisplayProps(block: ColorBlock, now: number) {
    let radius = block.radius;
    let opacity = 1;
    let color = block.color;
    const isGrayscale = !useCanvasStore.getState().isPlaying;

    if (block.animationState === 'appearing') {
      const t = Math.min(1, (now - block.createdAt) / APPEAR_DURATION);
      const eased = easeOutCubic(t);
      radius = block.radius * eased;
      const white: RGB = { r: 255, g: 255, b: 255 };
      color = lerpRgb(white, block.color, eased);
    } else if (block.animationState === 'disappearing' && block.disappearStartTime) {
      const t = Math.min(1, (now - block.disappearStartTime) / DISAPPEAR_DURATION);
      const eased = easeInCubic(t);
      const expand = 1 + eased * 1.5;
      radius = block.radius * expand;
      opacity = 1 - eased;
    }

    if (isGrayscale) {
      color = { r: 170, g: 170, b: 170 };
    }

    return { radius, opacity, color, isGrayscale };
  }

  private drawBlock(block: ColorBlock, now: number) {
    const { radius, opacity, color } = this.getBlockDisplayProps(block, now);
    if (opacity <= 0 || radius <= 0) return;

    const history = this.positionHistory.get(block.id);
    if (history && history.length > 0) {
      const targetTime = now - TRAIL_DELAY;
      let older: PositionHistory | null = null;
      for (let i = 0; i < history.length - 1; i++) {
        if (history[i].timestamp <= targetTime && history[i + 1].timestamp >= targetTime) {
          const t = (targetTime - history[i].timestamp) / (history[i + 1].timestamp - history[i].timestamp);
          older = {
            x: history[i].x + (history[i + 1].x - history[i].x) * t,
            y: history[i].y + (history[i + 1].y - history[i].y) * t,
            timestamp: targetTime,
          };
          break;
        }
      }
      if (!older && history.length > 0) {
        older = history[0];
      }
      if (older) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity * 0.3;
        this.drawSingleCircle(older.x, older.y, radius * 0.9, color);
        this.ctx.restore();
      }
    }

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.drawSingleCircle(block.x, block.y, radius, color);
    this.ctx.restore();
  }

  private drawSingleCircle(x: number, y: number, radius: number, color: RGB) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    const { r, g, b } = color;
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.85)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.15)`);
    this.ctx.fillStyle = gradient;
    this.ctx.shadowColor = rgbToString(color);
    this.ctx.shadowBlur = radius * 0.6;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawCrosshair() {
    const mouse = this.getMousePosition();
    if (!mouse) return;
    const { x, y } = mouse;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    const len = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(x - len, y);
    this.ctx.lineTo(x - 4, y);
    this.ctx.moveTo(x + 4, y);
    this.ctx.lineTo(x + len, y);
    this.ctx.moveTo(x, y - len);
    this.ctx.lineTo(x, y - 4);
    this.ctx.moveTo(x, y + 4);
    this.ctx.lineTo(x, y + len);
    this.ctx.stroke();
    this.ctx.restore();
  }

  render() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    this.ctx.clearRect(0, 0, w, h);

    this.ctx.fillStyle = '#1E1E1E';
    this.ctx.fillRect(0, 0, w, h);

    const state = useCanvasStore.getState();
    const now = performance.now();
    this.updatePositionHistory(state.colorBlocks, now);

    const sortedBlocks = [...state.colorBlocks].sort((a, b) => {
      const aKey = a.animationState === 'disappearing' ? 0 : 1;
      const bKey = b.animationState === 'disappearing' ? 0 : 1;
      if (aKey !== bKey) return aKey - bKey;
      return a.createdAt - b.createdAt;
    });

    for (const block of sortedBlocks) {
      this.drawBlock(block, now);
    }

    const disappearing = state.colorBlocks.filter(
      (b) => b.animationState === 'disappearing' && b.disappearStartTime,
    );
    if (disappearing.length > 0) {
      const toRemove: string[] = [];
      for (const b of disappearing) {
        if (b.disappearStartTime && now - b.disappearStartTime >= DISAPPEAR_DURATION) {
          toRemove.push(b.id);
        }
      }
      if (toRemove.length > 0 && !state.isClearing) {
        for (const id of toRemove) {
          useCanvasStore.getState().removeBlock(id);
        }
      }
    }

    this.drawCrosshair();
  }

  exportImage(): string {
    const rect = this.canvas.getBoundingClientRect();
    const tmp = document.createElement('canvas');
    tmp.width = rect.width;
    tmp.height = rect.height;
    const tctx = tmp.getContext('2d')!;
    tctx.fillStyle = '#1E1E1E';
    tctx.fillRect(0, 0, rect.width, rect.height);
    const state = useCanvasStore.getState();
    const now = performance.now();
    for (const block of state.colorBlocks) {
      if (block.animationState === 'disappearing') continue;
      const { r, g, b } = block.color;
      const radius = block.radius;
      const gradient = tctx.createRadialGradient(block.x, block.y, 0, block.x, block.y, radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.85)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.15)`);
      tctx.fillStyle = gradient;
      tctx.shadowColor = rgbToString(block.color);
      tctx.shadowBlur = radius * 0.6;
      tctx.beginPath();
      tctx.arc(block.x, block.y, radius, 0, Math.PI * 2);
      tctx.fill();
    }
    return tmp.toDataURL('image/png');
  }

  getBlockAt(x: number, y: number): ColorBlock | null {
    const blocks = useCanvasStore.getState().colorBlocks;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.animationState === 'disappearing') continue;
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.radius * b.radius) {
        return b;
      }
    }
    return null;
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
  }
}
