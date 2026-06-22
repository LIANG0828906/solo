export interface FlowParams {
  density: number;
  speed: number;
  hue: number;
  opacity: number;
}

interface FlowLine {
  points: { x: number; y: number }[];
  width: number;
  hueOffset: number;
  driftAngle: number;
  driftSpeed: number;
  age: number;
  maxAge: number;
  segmentCount: number;
}

const PERM: number[] = [];
const GRAD: { x: number; y: number }[] = [];

function initNoise() {
  const p: number[] = [];
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) {
    const angle = (i / 256) * Math.PI * 2;
    GRAD[i] = { x: Math.cos(angle), y: Math.sin(angle) };
  }
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function dot(g: { x: number; y: number }, x: number, y: number): number {
  return g.x * x + g.y * y;
}

function perlin2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = PERM[PERM[X] + Y];
  const ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y];
  const bb = PERM[PERM[X + 1] + Y + 1];
  const x1 = lerp(dot(GRAD[aa], xf, yf), dot(GRAD[ba], xf - 1, yf), u);
  const x2 = lerp(dot(GRAD[ab], xf, yf - 1), dot(GRAD[bb], xf - 1, yf - 1), u);
  return lerp(x1, x2, v);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export class FlowRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lines: FlowLine[] = [];
  private animId: number = 0;
  private time: number = 0;

  private target: FlowParams = { density: 40, speed: 1.0, hue: 240, opacity: 0.7 };
  private current: FlowParams = { density: 40, speed: 1.0, hue: 240, opacity: 0.7 };

  private frameTimestamps: number[] = [];
  private fps: number = 60;
  private lowFpsStart: number = 0;
  private isLowPerformance: boolean = false;
  private densityReduced: boolean = false;

  private onFpsUpdate: ((fps: number, lowPerf: boolean) => void) | null = null;

  private panOffset = { x: 0, y: 0 };
  private zoomScale = 1.0;
  private touchStartDist = 0;
  private touchStartZoom = 1.0;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private isTouchPanning = false;

  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    initNoise();
    this.handleResize = this.handleResize.bindThis();
    this.onTouchStart = this.onTouchStart.bindThis();
    this.onTouchMove = this.onTouchMove.bindThis();
    this.onTouchEnd = this.onTouchEnd.bindThis();
    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
    this.initLines();
  }

  setOnFpsUpdate(cb: (fps: number, lowPerf: boolean) => void) {
    this.onFpsUpdate = cb;
  }

  updateParams(params: FlowParams) {
    this.target = { ...params };
  }

  private handleResize() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeCanvas();
    }, 300);
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = Math.max(800, rect.width);
    const h = Math.max(500, rect.height);
    this.canvas.width = w * window.devicePixelRatio;
    this.canvas.height = h * window.devicePixelRatio;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isTouchPanning = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      this.isTouchPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDist = Math.sqrt(dx * dx + dy * dy);
      this.touchStartZoom = this.zoomScale;
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isTouchPanning) {
      this.panOffset.x += e.touches[0].clientX - this.lastTouchX;
      this.panOffset.y += e.touches[0].clientY - this.lastTouchY;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.zoomScale = Math.max(0.5, Math.min(2.0, this.touchStartZoom * (dist / this.touchStartDist)));
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.isTouchPanning = false;
    }
  }

  private initLines() {
    this.lines = [];
    const count = Math.round(this.current.density);
    for (let i = 0; i < count; i++) {
      this.lines.push(this.createLine());
    }
  }

  private createLine(): FlowLine {
    const w = this.canvas.width / window.devicePixelRatio || 800;
    const h = this.canvas.height / window.devicePixelRatio || 500;
    const segmentCount = 60 + Math.floor(Math.random() * 40);
    const points: { x: number; y: number }[] = [];
    let x = Math.random() * w;
    let y = Math.random() * h;
    points.push({ x, y });
    for (let i = 1; i < segmentCount; i++) {
      const angle = perlin2D(x * 0.003, y * 0.003 + this.time * 0.0003) * Math.PI * 4;
      x += Math.cos(angle) * 3;
      y += Math.sin(angle) * 3;
      points.push({ x, y });
    }
    return {
      points,
      width: 2 + Math.random() * 2,
      hueOffset: Math.random() * 30 - 15,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: 0.2 + Math.random() * 0.5,
      age: 0,
      maxAge: 200 + Math.floor(Math.random() * 300),
      segmentCount,
    };
  }

  private smoothParams() {
    const rate = 0.08;
    this.current.density = lerp(this.current.density, this.target.density, rate);
    this.current.speed = lerp(this.current.speed, this.target.speed, rate);
    this.current.opacity = lerp(this.current.opacity, this.target.opacity, rate);
    if (Math.abs(this.current.hue - this.target.hue) > 180) {
      if (this.current.hue < this.target.hue) {
        this.current.hue = lerp(this.current.hue, this.target.hue - 360, rate);
        if (this.current.hue < 0) this.current.hue += 360;
      } else {
        this.current.hue = lerp(this.current.hue, this.target.hue + 360, rate);
        if (this.current.hue >= 360) this.current.hue -= 360;
      }
    } else {
      this.current.hue = lerp(this.current.hue, this.target.hue, rate);
    }
  }

  private checkFps(now: number) {
    this.frameTimestamps.push(now);
    while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
      this.frameTimestamps.shift();
    }
    this.fps = this.frameTimestamps.length;

    if (this.fps < 55 && !this.densityReduced) {
      this.current.density = Math.max(10, this.current.density * 0.8);
      this.target.density = Math.max(10, this.target.density * 0.8);
      this.densityReduced = true;
    }
    if (this.fps >= 55) {
      this.densityReduced = false;
    }

    if (this.fps < 45) {
      if (!this.lowFpsStart) {
        this.lowFpsStart = now;
      }
      if (now - this.lowFpsStart > 2000) {
        this.isLowPerformance = true;
      }
    } else {
      this.lowFpsStart = 0;
      this.isLowPerformance = false;
    }

    this.onFpsUpdate?.(this.fps, this.isLowPerformance);
  }

  start() {
    this.resizeCanvas();
    const loop = (now: number) => {
      this.checkFps(now);
      this.smoothParams();
      this.time = now;
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }

  private update() {
    const targetCount = Math.round(this.current.density);
    while (this.lines.length < targetCount) {
      this.lines.push(this.createLine());
    }
    while (this.lines.length > targetCount) {
      this.lines.pop();
    }

    const w = this.canvas.width / window.devicePixelRatio || 800;
    const h = this.canvas.height / window.devicePixelRatio || 500;
    const speedFactor = this.current.speed;

    for (const line of this.lines) {
      line.age++;
      if (line.age > line.maxAge) {
        Object.assign(line, this.createLine());
        continue;
      }

      line.driftAngle += (Math.random() - 0.5) * 0.02;
      const driftX = Math.cos(line.driftAngle) * line.driftSpeed * speedFactor;
      const driftY = Math.sin(line.driftAngle) * line.driftSpeed * speedFactor;

      for (const pt of line.points) {
        pt.x += driftX;
        pt.y += driftY;
      }

      const lastPt = line.points[line.points.length - 1];
      const angle = perlin2D(lastPt.x * 0.003, lastPt.y * 0.003 + this.time * 0.0003) * Math.PI * 4;
      const nx = lastPt.x + Math.cos(angle) * 3 * speedFactor;
      const ny = lastPt.y + Math.sin(angle) * 3 * speedFactor;
      line.points.push({ x: nx, y: ny });
      if (line.points.length > line.segmentCount + 20) {
        line.points.shift();
      }

      const margin = 50;
      if (line.points.some((pt) => pt.x < -margin || pt.x > w + margin || pt.y < -margin || pt.y > h + margin)) {
        Object.assign(line, this.createLine());
      }
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.panOffset.x, this.panOffset.y);
    ctx.scale(this.zoomScale, this.zoomScale);

    const baseHue = this.current.hue;
    const baseOpacity = this.current.opacity;

    for (const line of this.lines) {
      if (line.points.length < 2) continue;
      const segCount = line.points.length;
      const scaledWidth = line.width * this.zoomScale;

      for (let i = 1; i < segCount; i++) {
        const progress = i / segCount;
        const alpha = baseOpacity * (1 - progress) * (1 - progress);
        if (alpha < 0.005) continue;

        const hue = (baseHue + line.hueOffset + progress * 20) % 360;
        const sat = 80 + progress * 10;
        const light = 55 + progress * 15;
        const [r, g, b] = hslToRgb(hue < 0 ? hue + 360 : hue, sat / 100, light / 100);

        ctx.beginPath();
        ctx.moveTo(line.points[i - 1].x, line.points[i - 1].y);
        ctx.lineTo(line.points[i].x, line.points[i].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = scaledWidth * (1 - progress * 0.5);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
