import { BrushModel, StrokeState } from './brush.js';

export interface InkPoint {
  x: number;
  y: number;
  width: number;
  pressure: number;
  porosity: number;
  time: number;
  alpha: number;
}

export interface Splatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface PaperNoise {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export class InkRenderer {
  private ctx: CanvasRenderingContext2D;
  private paperCtx: CanvasRenderingContext2D;
  private strokeCtx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private paperNoise: PaperNoise;
  private activePoints: InkPoint[] = [];
  private currentStroke: InkPoint[] = [];
  private splatters: Splatter[] = [];
  private animationId: number | null = null;
  private onRender?: () => void;

  constructor(
    mainCtx: CanvasRenderingContext2D,
    width: number,
    height: number,
    onRender?: () => void
  ) {
    this.ctx = mainCtx;
    this.width = width;
    this.height = height;
    this.onRender = onRender;

    const paperCanvas = document.createElement('canvas');
    paperCanvas.width = width;
    paperCanvas.height = height;
    this.paperCtx = paperCanvas.getContext('2d')!;

    const strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = width;
    strokeCanvas.height = height;
    this.strokeCtx = strokeCanvas.getContext('2d')!;

    this.paperNoise = this.generatePaperNoise();
    this.drawPaperTexture();
    this.renderComposite();
    this.startAnimationLoop();
  }

  private generatePaperNoise(): PaperNoise {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      const intensity = Math.floor(230 + noise * 25);
      data[i] = Math.floor(intensity * 0.96);
      data[i + 1] = Math.floor(intensity * 0.90);
      data[i + 2] = Math.floor(intensity * 0.78);
      data[i + 3] = Math.floor(30 + Math.random() * 40);
    }

    return { data, width: this.width, height: this.height };
  }

  private drawPaperTexture(): void {
    const { width, height, paperCtx } = this;

    const gradient = paperCtx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, '#F7EBD0');
    gradient.addColorStop(0.7, '#F5E6C8');
    gradient.addColorStop(1, '#E8D4A8');
    paperCtx.fillStyle = gradient;
    paperCtx.fillRect(0, 0, width, height);

    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const nctx = noiseCanvas.getContext('2d')!;
    const imageData = nctx.createImageData(width, height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const n = Math.random();
      const v = Math.floor(200 + n * 55);
      imageData.data[i] = v;
      imageData.data[i + 1] = Math.floor(v * 0.95);
      imageData.data[i + 2] = Math.floor(v * 0.82);
      imageData.data[i + 3] = Math.floor(15 + n * 35);
    }
    nctx.putImageData(imageData, 0, 0);
    paperCtx.globalAlpha = 0.4;
    paperCtx.drawImage(noiseCanvas, 0, 0);
    paperCtx.globalAlpha = 1;

    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const len = 3 + Math.random() * 12;
      const angle = Math.random() * Math.PI * 2;
      paperCtx.strokeStyle = `rgba(180, 150, 100, ${0.05 + Math.random() * 0.08})`;
      paperCtx.lineWidth = 0.3 + Math.random() * 0.5;
      paperCtx.beginPath();
      paperCtx.moveTo(x, y);
      paperCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      paperCtx.stroke();
    }

    this.drawRoughEdges(paperCtx);
  }

  private drawRoughEdges(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this;
    const edgeDepth = 12;
    ctx.save();

    ctx.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < width; x += 2) {
      const depth = edgeDepth * (0.3 + Math.random() * 0.7);
      ctx.fillStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.5})`;
      ctx.fillRect(x, 0, 2, depth);
      ctx.fillRect(x, height - depth, 2, depth);
    }
    for (let y = 0; y < height; y += 2) {
      const depth = edgeDepth * (0.3 + Math.random() * 0.7);
      ctx.fillStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.5})`;
      ctx.fillRect(0, y, depth, 2);
      ctx.fillRect(width - depth, y, depth, 2);
    }

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(139, 100, 50, 0.25)';
    ctx.lineWidth = 1.5;
    for (let side = 0; side < 4; side++) {
      ctx.beginPath();
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let x: number, y: number;
        const wobble = (Math.random() - 0.5) * 3;
        switch (side) {
          case 0: x = t * width; y = 4 + wobble; break;
          case 1: x = width - 4 + wobble; y = t * height; break;
          case 2: x = (1 - t) * width; y = height - 4 + wobble; break;
          default: x = 4 + wobble; y = (1 - t) * height;
        }
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  addInkPoint(
    x: number,
    y: number,
    width: number,
    pressure: number,
    porosity: number,
    brush: BrushModel
  ): void {
    const point: InkPoint = {
      x, y, width, pressure, porosity,
      time: performance.now(),
      alpha: 0.7 + pressure * 0.3,
    };
    this.currentStroke.push(point);
    this.activePoints.push(point);
    this.drawInkPoint(point, brush);
  }

  drawStrokeSegment(
    fromX: number, fromY: number,
    toX: number, toY: number,
    widthFrom: number, widthTo: number,
    pressure: number, porosity: number,
    brush: BrushModel
  ): void {
    const color = brush.parseColor(brush.getInkColor());
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(2, Math.ceil(dist / 2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = fromX + dx * t;
      const y = fromY + dy * t;
      const w = widthFrom + (widthTo - widthFrom) * t;

      this.drawFeibaiDot(x, y, w, pressure, porosity, color);
    }
  }

  private drawFeibaiDot(
    x: number, y: number,
    width: number, pressure: number,
    porosity: number,
    color: { r: number; g: number; b: number }
  ): void {
    const ctx = this.strokeCtx;
    const radius = width / 2;
    const p = Math.max(0.05, Math.min(0.25, porosity));

    ctx.save();

    const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    coreGrad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${0.9 * pressure + 0.1})`);
    coreGrad.addColorStop(0.6, `rgba(${color.r},${color.g},${color.b},${0.6 * pressure + 0.2})`);
    coreGrad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    const voidCount = Math.floor(Math.PI * radius * radius * p * 0.3);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < voidCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.9;
      const vx = x + Math.cos(angle) * r;
      const vy = y + Math.sin(angle) * r;
      const vr = 0.5 + Math.random() * Math.max(0.8, radius * 0.15);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(vx, vy, vr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawInkPoint(point: InkPoint, brush: BrushModel): void {
    const color = brush.parseColor(brush.getInkColor());
    this.drawFeibaiDot(point.x, point.y, point.width, point.pressure, point.porosity, color);
  }

  finalizeStroke(brush: BrushModel): void {
    this.createSplatters();
    this.solidifyActiveBleed(brush);
    this.currentStroke = [];
  }

  private createSplatters(): void {
    if (this.currentStroke.length < 3) return;

    const last = this.currentStroke[this.currentStroke.length - 1];
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.splatters.push({
        x: last.x,
        y: last.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 0.5 + Math.random() * Math.max(1, last.width * 0.08),
        alpha: 0.4 + Math.random() * 0.4,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  private solidifyActiveBleed(brush: BrushModel): void {
    const color = brush.parseColor(brush.getInkColor());
    const ctx = this.strokeCtx;
    const now = performance.now();

    for (const point of this.activePoints) {
      const elapsed = (now - point.time) / 1000;
      const bleedRadius = brush.calculateBleedRadius(point.pressure, elapsed * 1000);
      if (bleedRadius > 0.5) {
        const totalR = point.width / 2 + bleedRadius;
        const grad = ctx.createRadialGradient(
          point.x, point.y, point.width / 2 * 0.5,
          point.x, point.y, totalR
        );
        grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0)`);
        grad.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},${0.08 * point.pressure})`);
        grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, totalR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    this.activePoints = [];
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this.updateAnimatedPaperTexture(now);
      this.updateSplatters(dt);
      this.renderComposite();

      if (this.onRender) this.onRender();
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  private updateAnimatedPaperTexture(time: number): void {
  }

  private updateSplatters(dt: number): void {
    if (this.splatters.length === 0) return;

    const gravity = 180;
    const ctx = this.strokeCtx;

    for (let i = this.splatters.length - 1; i >= 0; i--) {
      const s = this.splatters[i];
      s.vy += gravity * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life += dt;

      const progress = s.life / s.maxLife;
      if (progress >= 1) {
        this.splatters.splice(i, 1);
        continue;
      }

      const alpha = s.alpha * (1 - progress * 0.7);
      ctx.fillStyle = `rgba(26,26,26,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (1 + progress * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderComposite(): void {
    const { ctx, width, height, paperCtx, strokeCtx } = this;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(paperCtx.canvas, 0, 0);
    ctx.drawImage(strokeCtx.canvas, 0, 0);
  }

  clear(): void {
    this.strokeCtx.clearRect(0, 0, this.width, this.height);
    this.activePoints = [];
    this.currentStroke = [];
    this.splatters = [];
  }

  getPaperCanvas(): HTMLCanvasElement {
    return this.paperCtx.canvas;
  }

  getStrokeCanvas(): HTMLCanvasElement {
    return this.strokeCtx.canvas;
  }

  getCompositeCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.paperCtx.canvas, 0, 0);
    ctx.drawImage(this.strokeCtx.canvas, 0, 0);
    return canvas;
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

export function animateInkPool(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = w / 2 - 4;

  interface Particle {
    x: number;
    y: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
  }

  const particles: Particle[] = [];

  function spawnParticle(): void {
    particles.push({
      x: cx + (Math.random() - 0.5) * radius * 0.6,
      y: cy + radius * 0.3,
      vy: -10 - Math.random() * 15,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.2,
      life: 0,
      maxLife: 3 + Math.random() * 3,
    });
  }

  let lastSpawn = 0;
  let animId: number;

  function render(time: number): void {
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(cx, cy - 5, 2, cx, cy, radius);
    grad.addColorStop(0, '#3A3A3A');
    grad.addColorStop(0.5, '#2A2A2A');
    grad.addColorStop(1, '#1A1A1A');

    ctx.save();
    ctx.beginPath();
    const waveAmp = 2;
    const waveFreq = 1.5;
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const wave = Math.sin(angle * 3 + time * 0.001 * waveFreq * Math.PI * 2) * waveAmp;
      const r = radius + wave;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,20,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.3, radius * 0.5, radius * 0.2, 0, 0, Math.PI * 2);
    const hl = ctx.createRadialGradient(cx, cy - radius * 0.4, 0, cx, cy - radius * 0.3, radius * 0.5);
    hl.addColorStop(0, 'rgba(120,120,120,0.25)');
    hl.addColorStop(1, 'rgba(60,60,60,0)');
    ctx.fillStyle = hl;
    ctx.fill();
    ctx.restore();

    if (time - lastSpawn > 400 && particles.length < 10) {
      spawnParticle();
      lastSpawn = time;
    }

    const dt = 16 / 1000;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy * dt;
      p.life += dt;
      const progress = p.life / p.maxLife;
      if (progress >= 1) {
        particles.splice(i, 1);
        continue;
      }
      const a = p.alpha * (1 - progress);
      ctx.fillStyle = `rgba(180,170,160,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + progress), 0, Math.PI * 2);
      ctx.fill();
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);
  return () => cancelAnimationFrame(animId);
}
