import {
  animateValue,
  animateShatter,
  createShatterPieces,
  animateFlyingWhite,
  easeOutCubic,
} from './animation';

export interface RankConfig {
  rank: number;
  name: string;
  material: 'jade' | 'wood' | 'bamboo';
  width: number;
  height: number;
  baseColor: string;
  decoration: string;
  hasDragonPattern: boolean;
  format: {
    header: string;
    date: boolean;
    signature: boolean;
  };
}

export interface InkPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
  diffusionRadius: number;
}

export interface InkStroke {
  points: InkPoint[];
  color: string;
  startTime: number;
  endTime: number;
}

export interface MemorialLog {
  id: string;
  timestamp: number;
  rank: number;
  rankName: string;
  wordCount: number;
  duration: number;
  annotation: string;
  annotationColor: string;
  stars: number;
  strokes: InkStroke[];
  revisionCount: number;
  prevAnnotations: string[];
}

const RANK_CONFIGS: RankConfig[] = [
  {
    rank: 1,
    name: '一品大员',
    material: 'jade',
    width: 80,
    height: 350,
    baseColor: '#E8E0D0',
    decoration: '螭龙纹',
    hasDragonPattern: true,
    format: { header: '臣跪奏', date: true, signature: true },
  },
  {
    rank: 2,
    name: '二品官员',
    material: 'jade',
    width: 76,
    height: 340,
    baseColor: '#E0D8C8',
    decoration: '祥云纹',
    hasDragonPattern: false,
    format: { header: '臣谨奏', date: true, signature: true },
  },
  {
    rank: 3,
    name: '三品官员',
    material: 'jade',
    width: 72,
    height: 330,
    baseColor: '#D8D0C0',
    decoration: '回纹',
    hasDragonPattern: false,
    format: { header: '臣奏', date: true, signature: true },
  },
  {
    rank: 4,
    name: '四品官员',
    material: 'wood',
    width: 68,
    height: 320,
    baseColor: '#C4A882',
    decoration: '卷草纹',
    hasDragonPattern: false,
    format: { header: '谨奏', date: true, signature: true },
  },
  {
    rank: 5,
    name: '五品官员',
    material: 'wood',
    width: 64,
    height: 310,
    baseColor: '#B89B72',
    decoration: '雷纹',
    hasDragonPattern: false,
    format: { header: '奏', date: true, signature: false },
  },
  {
    rank: 6,
    name: '六品官员',
    material: 'wood',
    width: 60,
    height: 300,
    baseColor: '#A88B62',
    decoration: '绳纹',
    hasDragonPattern: false,
    format: { header: '禀', date: true, signature: false },
  },
  {
    rank: 7,
    name: '七品官员',
    material: 'wood',
    width: 56,
    height: 290,
    baseColor: '#9B7E55',
    decoration: '无纹饰',
    hasDragonPattern: false,
    format: { header: '呈', date: false, signature: false },
  },
  {
    rank: 8,
    name: '八品官员',
    material: 'bamboo',
    width: 52,
    height: 280,
    baseColor: '#D4C48C',
    decoration: '无纹饰',
    hasDragonPattern: false,
    format: { header: '报', date: false, signature: false },
  },
  {
    rank: 9,
    name: '九品官员',
    material: 'bamboo',
    width: 50,
    height: 270,
    baseColor: '#C8B87C',
    decoration: '无纹饰',
    hasDragonPattern: false,
    format: { header: '白', date: false, signature: false },
  },
];

const ANNOTATIONS = ['准奏', '驳回', '再议', '留中', '善'];

export class Tablet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private annotationCanvas: HTMLCanvasElement;
  private annotationCtx: CanvasRenderingContext2D;
  private container: HTMLElement;

  private rankConfig: RankConfig;
  private strokes: InkStroke[] = [];
  private currentStroke: InkStroke | null = null;
  private isDrawing = false;
  private lastPoint: { x: number; y: number; timestamp: number } | null = null;

  private logs: MemorialLog[] = [];
  private currentLogId: string | null = null;
  private revisionCount = 0;
  private maxRevisions = 3;

  private isReplaying = false;
  private isPresenting = false;
  private isShattered = false;

  private writingStartTime = 0;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  private animationFrameId: number | null = null;
  private pendingDiffusions: { point: InkPoint; startTime: number }[] = [];

  private onLogUpdate?: (logs: MemorialLog[]) => void;
  private onPresentComplete?: (annotation: string) => void;
  private onShatter?: () => void;
  private onStrokesChange?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    annotationCanvas: HTMLCanvasElement,
    container: HTMLElement,
    initialRank: number = 1
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.annotationCanvas = annotationCanvas;
    this.annotationCtx = annotationCanvas.getContext('2d')!;
    this.container = container;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.rankConfig = RANK_CONFIGS.find((c) => c.rank === initialRank) || RANK_CONFIGS[0];

    this.initCanvas();
    this.bindEvents();
    this.drawTabletTexture();
    this.render();
  }

  private initCanvas(): void {
    const { width, height } = this.rankConfig;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    this.annotationCanvas.width = width * dpr;
    this.annotationCanvas.height = height * dpr;
    this.annotationCanvas.style.width = `${width}px`;
    this.annotationCanvas.style.height = `${height}px`;
    this.annotationCtx.scale(dpr, dpr);

    this.offscreenCanvas.width = width * dpr;
    this.offscreenCanvas.height = height * dpr;
    this.offscreenCtx.scale(dpr, dpr);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.isReplaying || this.isPresenting || this.isShattered) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.strokes.length === 0) {
      this.writingStartTime = performance.now();
    }

    this.isDrawing = true;
    this.currentStroke = {
      points: [],
      color: '#1A1A1A',
      startTime: performance.now(),
      endTime: 0,
    };

    this.lastPoint = { x, y, timestamp: performance.now() };
    this.addPoint(x, y, 0);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDrawing || !this.currentStroke) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();

    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = now - this.lastPoint.timestamp;
      const speed = dt > 0 ? dist / dt : 0;

      this.addPoint(x, y, speed);
    }

    this.lastPoint = { x, y, timestamp: now };
  }

  private handleMouseUp(): void {
    if (!this.isDrawing || !this.currentStroke) return;

    this.isDrawing = false;
    this.currentStroke.endTime = performance.now();
    this.strokes.push(this.currentStroke);
    this.currentStroke = null;
    this.lastPoint = null;

    if (this.onStrokesChange) {
      this.onStrokesChange();
    }
  }

  private addPoint(x: number, y: number, speed: number): void {
    if (!this.currentStroke) return;

    const pressure = this.calculatePressure(speed);
    const diffusionRadius = 3 + Math.random() * 5;

    const point: InkPoint = {
      x,
      y,
      pressure,
      timestamp: performance.now(),
      diffusionRadius,
    };

    this.currentStroke.points.push(point);
    this.pendingDiffusions.push({ point, startTime: performance.now() });
  }

  private calculatePressure(speed: number): number {
    const minWidth = 1;
    const maxWidth = 8;
    const normalizedSpeed = Math.min(speed / 2, 1);
    return maxWidth - normalizedSpeed * (maxWidth - minWidth);
  }

  setRank(rank: number): void {
    const config = RANK_CONFIGS.find((c) => c.rank === rank);
    if (!config) return;

    this.rankConfig = config;
    this.strokes = [];
    this.currentLogId = null;
    this.revisionCount = 0;
    this.isShattered = false;
    this.pendingDiffusions = [];

    this.initCanvas();
    this.drawTabletTexture();
    this.render();
    this.updateRevisionIndicator();
  }

  getRankConfig(): RankConfig {
    return this.rankConfig;
  }

  private drawTabletTexture(): void {
    const ctx = this.offscreenCtx;
    const { width, height, material, baseColor, hasDragonPattern, decoration } = this.rankConfig;

    ctx.clearRect(0, 0, width, height);

    if (material === 'jade') {
      this.drawJadeTexture(ctx, width, height, baseColor);
    } else if (material === 'wood') {
      this.drawWoodTexture(ctx, width, height, baseColor);
    } else {
      this.drawBambooTexture(ctx, width, height, baseColor);
    }

    if (hasDragonPattern) {
      this.drawDragonPattern(ctx, width, height);
    } else if (decoration !== '无纹饰') {
      this.drawBorderPattern(ctx, width, height, decoration);
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    const topGradient = ctx.createLinearGradient(0, 0, 0, 15);
    topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(2, 2, width - 4, 15);
  }

  private drawJadeTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    baseColor: string
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.3, this.lightenColor(baseColor, 10));
    gradient.addColorStop(0.7, this.darkenColor(baseColor, 5));
    gradient.addColorStop(1, this.darkenColor(baseColor, 10));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 10 + Math.random() * 30;
      const veinGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      veinGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      veinGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = veinGradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.strokeStyle = '#A0C4A8';
      ctx.lineWidth = 0.5;
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        startX + (Math.random() - 0.5) * 40,
        startY + 10 + Math.random() * 20,
        startX + (Math.random() - 0.5) * 30,
        startY + 20 + Math.random() * 30
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawWoodTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    baseColor: string
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, this.darkenColor(baseColor, 15));
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, this.darkenColor(baseColor, 15));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < height; i += 4) {
      const variation = Math.sin(i * 0.1) * 0.5 + Math.sin(i * 0.05) * 0.5;
      ctx.fillStyle = variation > 0 ? '#000000' : '#FFFFFF';
      ctx.globalAlpha = 0.08 * Math.abs(variation);
      ctx.fillRect(0, i, width, 2);
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const x = width * (0.2 + i * 0.15);
      ctx.beginPath();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.moveTo(x, 0);
      for (let y = 0; y < height; y += 10) {
        const offset = Math.sin(y * 0.03 + i) * 3;
        ctx.lineTo(x + offset, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawBambooTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    baseColor: string
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, this.darkenColor(baseColor, 20));
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, this.darkenColor(baseColor, 20));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(120, 100, 50, 0.4)';
    ctx.lineWidth = 2;
    for (let y = 30; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(150, 130, 60, 0.3)';
      ctx.fillRect(0, y - 2, width, 4);
    }

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 8; i++) {
      const x = 5 + i * ((width - 10) / 7);
      ctx.beginPath();
      ctx.strokeStyle = '#6B5A20';
      ctx.lineWidth = 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawDragonPattern(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;

    const centerX = width / 2;
    const topY = height * 0.12;

    ctx.beginPath();
    ctx.arc(centerX, topY + 15, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - 8, topY + 25);
    ctx.quadraticCurveTo(centerX - 20, topY + 40, centerX - 15, topY + 55);
    ctx.quadraticCurveTo(centerX - 10, topY + 70, centerX, topY + 80);
    ctx.quadraticCurveTo(centerX + 10, topY + 70, centerX + 15, topY + 55);
    ctx.quadraticCurveTo(centerX + 20, topY + 40, centerX + 8, topY + 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - 4, topY + 10);
    ctx.lineTo(centerX - 6, topY + 3);
    ctx.moveTo(centerX + 4, topY + 10);
    ctx.lineTo(centerX + 6, topY + 3);
    ctx.stroke();

    ctx.restore();
  }

  private drawBorderPattern(
    ctx: CanvasRenderingContext2D,
    _width: number,
    height: number,
    patternType: string
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 0.5;

    if (patternType === '祥云纹') {
      for (let y = 8; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(5, y);
        ctx.quadraticCurveTo(10, y - 5, 15, y);
        ctx.quadraticCurveTo(20, y + 5, 25, y);
        ctx.stroke();
      }
    } else if (patternType === '回纹') {
      for (let y = 10; y < height - 10; y += 20) {
        ctx.strokeRect(3, y, 8, 8);
        ctx.strokeRect(5, y + 2, 4, 4);
      }
    } else if (patternType === '卷草纹') {
      ctx.beginPath();
      for (let y = 5; y < height - 5; y += 2) {
        const x = 8 + Math.sin(y * 0.1) * 4;
        if (y === 5) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    } else if (patternType === '雷纹') {
      for (let y = 8; y < height - 8; y += 12) {
        ctx.beginPath();
        ctx.rect(4, y, 6, 6);
        ctx.rect(4, y + 6, 6, 6);
        ctx.stroke();
      }
    } else if (patternType === '绳纹') {
      ctx.beginPath();
      for (let y = 0; y < height; y += 2) {
        const x = 6 + Math.sin(y * 0.2) * 3;
        if (y === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  private render(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const renderLoop = () => {
      if (this.isShattered) {
        this.animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = this.ctx;
      const { width, height } = this.rankConfig;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(this.offscreenCanvas, 0, 0, width, height);

      this.strokes.forEach((stroke) => {
        this.drawStroke(ctx, stroke);
      });

      if (this.currentStroke) {
        this.drawStroke(ctx, this.currentStroke);
      }

      this.updateDiffusions(ctx);

      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  private drawStroke(ctx: CanvasRenderingContext2D, stroke: InkStroke): void {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];

      ctx.beginPath();
      ctx.lineWidth = (prev.pressure + curr.pressure) / 2;
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private updateDiffusions(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    const diffusionDuration = 500;

    this.pendingDiffusions = this.pendingDiffusions.filter((item) => {
      const elapsed = now - item.startTime;
      if (elapsed >= diffusionDuration) return false;

      const progress = elapsed / diffusionDuration;
      const radius = item.point.diffusionRadius * (1 - progress * 0.6);
      const alpha = 0.3 * (1 - progress);

      ctx.save();
      ctx.globalAlpha = alpha;

      const gradient = ctx.createRadialGradient(
        item.point.x,
        item.point.y,
        0,
        item.point.x,
        item.point.y,
        radius
      );
      gradient.addColorStop(0, '#333333');
      gradient.addColorStop(0.5, '#666666');
      gradient.addColorStop(1, 'rgba(102, 102, 102, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(item.point.x, item.point.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      return true;
    });
  }

  async presentMemorial(): Promise<string> {
    if (this.isPresenting || this.strokes.length === 0) {
      return '';
    }

    this.isPresenting = true;
    this.isDrawing = false;

    const annotation = ANNOTATIONS[Math.floor(Math.random() * ANNOTATIONS.length)];

    const riseDistance = -120;

    const containerParent = this.container.parentElement;
    if (containerParent) {
      const startY = 0;
      const endY = riseDistance;

      await animateValue(
        startY,
        endY,
        1500,
        (value) => {
          this.container.style.transform = `translateY(${value}px)`;
        },
        easeOutCubic
      );
    }

    const emperorSilhouette = document.getElementById('emperorSilhouette');
    if (emperorSilhouette) {
      emperorSilhouette.classList.add('visible');
      emperorSilhouette.style.transition = 'opacity 0.5s ease';
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const brushPen = document.getElementById('brushPen');
    if (brushPen) {
      brushPen.style.transition = 'transform 0.5s ease';
      brushPen.style.transformOrigin = 'bottom';
      brushPen.style.transform = 'rotate(-20deg)';
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    this.annotationCtx.clearRect(
      0,
      0,
      this.rankConfig.width,
      this.rankConfig.height
    );

    const annotationX = this.rankConfig.width - 55;
    const annotationY = this.rankConfig.height - 60;

    await animateFlyingWhite(
      this.annotationCtx,
      annotation,
      annotationX,
      annotationY,
      '#CC3333',
      1000
    );

    if (brushPen) {
      brushPen.style.transform = 'rotate(0deg)';
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (emperorSilhouette) {
      emperorSilhouette.classList.remove('visible');
    }

    if (containerParent) {
      await animateValue(riseDistance, 0, 800, (value) => {
        this.container.style.transform = `translateY(${value}px)`;
      }, easeOutCubic);
      this.container.style.transform = '';
    }

    this.addToLog(annotation);

    this.isPresenting = false;
    this.updateRevisionIndicator();

    if (this.onPresentComplete) {
      this.onPresentComplete(annotation);
    }

    return annotation;
  }

  private addToLog(annotation: string): void {
    const wordCount = this.estimateWordCount();
    const duration = this.writingStartTime > 0
      ? (performance.now() - this.writingStartTime) / 1000
      : 0;

    const stars = this.calculateStars(wordCount, duration);

    const strokesCopy = JSON.parse(JSON.stringify(this.strokes));

    const log: MemorialLog = {
      id: this.currentLogId || this.generateId(),
      timestamp: Date.now(),
      rank: this.rankConfig.rank,
      rankName: this.rankConfig.name,
      wordCount,
      duration,
      annotation,
      annotationColor: '#CC3333',
      stars,
      strokes: strokesCopy,
      revisionCount: this.revisionCount,
      prevAnnotations: [],
    };

    if (this.currentLogId) {
      const existingIndex = this.logs.findIndex((l) => l.id === this.currentLogId);
      if (existingIndex >= 0) {
        log.prevAnnotations = [
          ...this.logs[existingIndex].prevAnnotations,
          this.logs[existingIndex].annotation,
        ];
        log.revisionCount = this.revisionCount;
        this.logs[existingIndex] = log;
      }
    } else {
      this.currentLogId = log.id;
      this.logs.unshift(log);
    }

    if (this.onLogUpdate) {
      this.onLogUpdate([...this.logs]);
    }
  }

  private estimateWordCount(): number {
    let totalLength = 0;
    this.strokes.forEach((stroke) => {
      for (let i = 1; i < stroke.points.length; i++) {
        const dx = stroke.points[i].x - stroke.points[i - 1].x;
        const dy = stroke.points[i].y - stroke.points[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    });
    return Math.floor(totalLength / 50);
  }

  private calculateStars(wordCount: number, duration: number): number {
    const wordScore = Math.min(wordCount / 100, 1);
    const fluencyScore = duration > 0 ? Math.min(1, wordCount / (duration * 0.5)) : 0;
    const totalScore = wordScore * 0.6 + fluencyScore * 0.4;
    return Math.max(1, Math.min(5, Math.ceil(totalScore * 5)));
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearTablet(): void {
    if (this.isReplaying || this.isPresenting) return;

    this.strokes = [];
    this.currentStroke = null;
    this.pendingDiffusions = [];
    this.currentLogId = null;
    this.revisionCount = 0;
    this.isShattered = false;
    this.writingStartTime = 0;

    this.annotationCtx.clearRect(
      0,
      0,
      this.rankConfig.width,
      this.rankConfig.height
    );

    this.updateRevisionIndicator();

    if (this.onStrokesChange) {
      this.onStrokesChange();
    }
  }

  reviseMemorial(): boolean {
    if (this.isReplaying || this.isPresenting) return false;
    if (this.revisionCount >= this.maxRevisions) {
      this.shatter();
      return false;
    }

    this.revisionCount++;
    this.writingStartTime = performance.now();

    this.annotationCtx.clearRect(
      0,
      0,
      this.rankConfig.width,
      this.rankConfig.height
    );

    this.updateRevisionIndicator();

    return true;
  }

  private updateRevisionIndicator(): void {
    const dots = document.querySelectorAll('.revision-dot');
    dots.forEach((dot, index) => {
      if (index < this.revisionCount) {
        dot.classList.add('used');
      } else {
        dot.classList.remove('used');
      }
    });
  }

  private async shatter(): Promise<void> {
    this.isShattered = true;

    const { width, height } = this.rankConfig;
    const pieces = createShatterPieces(width, height, this.rankConfig.baseColor, 40);

    this.ctx.clearRect(0, 0, width, height);

    await animateShatter(this.canvas, this.ctx, pieces, 3000);

    if (this.onShatter) {
      this.onShatter();
    }
  }

  async replayLog(logId: string, speed: number = 1.2): Promise<void> {
    const log = this.logs.find((l) => l.id === logId);
    if (!log || this.isReplaying) return;

    this.isReplaying = true;
    this.isDrawing = false;

    this.setRank(log.rank);
    this.strokes = [];
    this.annotationCtx.clearRect(
      0,
      0,
      this.rankConfig.width,
      this.rankConfig.height
    );

    for (const stroke of log.strokes) {
      const replayStroke: InkStroke = {
        points: [],
        color: stroke.color,
        startTime: performance.now(),
        endTime: 0,
      };

      this.strokes.push(replayStroke);

      const strokeDuration = stroke.endTime - stroke.startTime;
      const replayDuration = strokeDuration / speed;

      for (let i = 0; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const pointProgress = i / Math.max(1, stroke.points.length - 1);
        const pointDelay = pointProgress * replayDuration;

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            replayStroke.points.push({
              ...point,
              timestamp: performance.now(),
            });
            this.pendingDiffusions.push({
              point: { ...point, timestamp: performance.now() },
              startTime: performance.now(),
            });
            resolve();
          }, pointDelay / (stroke.points.length > 1 ? stroke.points.length / 10 : 1));
        });
      }

      replayStroke.endTime = performance.now();
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    await animateFlyingWhite(
      this.annotationCtx,
      log.annotation,
      this.rankConfig.width - 55,
      this.rankConfig.height - 60,
      '#CC3333',
      1000
    );

    this.isReplaying = false;
    this.currentLogId = logId;
    this.revisionCount = log.revisionCount;
    this.updateRevisionIndicator();
  }

  getLogs(): MemorialLog[] {
    return this.logs;
  }

  getRevisionCount(): number {
    return this.revisionCount;
  }

  getMaxRevisions(): number {
    return this.maxRevisions;
  }

  hasStrokes(): boolean {
    return this.strokes.length > 0;
  }

  isShatteredState(): boolean {
    return this.isShattered;
  }

  canPresent(): boolean {
    return (
      !this.isPresenting &&
      !this.isReplaying &&
      !this.isShattered &&
      this.strokes.length > 0
    );
  }

  setOnLogUpdate(callback: (logs: MemorialLog[]) => void): void {
    this.onLogUpdate = callback;
  }

  setOnPresentComplete(callback: (annotation: string) => void): void {
    this.onPresentComplete = callback;
  }

  setOnShatter(callback: () => void): void {
    this.onShatter = callback;
  }

  setOnStrokesChange(callback: () => void): void {
    this.onStrokesChange = callback;
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
