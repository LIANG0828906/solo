import { audioManager } from '@/engine/AudioManager';
import { CATEGORY_COLORS } from '@/engine/SoundBlock';
import type { SoundCategory } from '@/engine/SoundBlock';

export interface HotSpot {
  id: string;
  x: number;
  y: number;
  category: SoundCategory;
  label: string;
}

const HOT_SPOTS: HotSpot[] = [
  { id: 'lamp-1', x: 0.18, y: 0.46, category: 'nature', label: '夜雨' },
  { id: 'lamp-2', x: 0.5, y: 0.38, category: 'traffic', label: '车流' },
  { id: 'lamp-3', x: 0.82, y: 0.5, category: 'voice', label: '脚步' },
  { id: 'window-1', x: 0.32, y: 0.26, category: 'electronic', label: '电台' },
  { id: 'window-2', x: 0.68, y: 0.22, category: 'nature', label: '晚风' },
];

export class CityScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private bgCache: HTMLCanvasElement | null = null;
  private running = false;
  private rafId = 0;
  private startTime = 0;
  private audioLevel = 0;
  private onHotspotClick: ((hotspot: HotSpot) => void) | null = null;
  private onPointerDrop: ((hotspotId: string, clientX: number, clientY: number) => void) | null = null;
  private hoveringHotspot: string | null = null;
  private pulse = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.handleClick = this.handleClick.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.loop = this.loop.bind(this);
  }

  setOnHotspotClick(cb: (h: HotSpot) => void): void {
    this.onHotspotClick = cb;
  }

  setOnPointerDrop(cb: (hotspotId: string, x: number, y: number) => void): void {
    this.onPointerDrop = cb;
  }

  static get hotspots(): HotSpot[] {
    return HOT_SPOTS;
  }

  static getHotspotAtPoint(clientX: number, clientY: number, canvas: HTMLCanvasElement): HotSpot | null {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    for (let i = HOT_SPOTS.length - 1; i >= 0; i--) {
      const h = HOT_SPOTS[i];
      const rx = Math.abs(px - h.x) * rect.width;
      const ry = Math.abs(py - h.y) * rect.height;
      const r = Math.max(26, Math.min(rect.width, rect.height) * 0.05);
      if (rx * rx + ry * ry <= r * r) return h;
    }
    return null;
  }

  getHotspotAtPoint(clientX: number, clientY: number): HotSpot | null {
    return CityScene.getHotspotAtPoint(clientX, clientY, this.canvas);
  }

  mount(): void {
    this.resize();
    this.buildBackground();
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('pointermove', this.handleMove);
    this.startTime = performance.now();
    this.running = true;
    audioManager.setDataCallback(() => {
      this.audioLevel = audioManager.getAverageLevel();
    });
    this.loop();
  }

  unmount(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('pointermove', this.handleMove);
    audioManager.setDataCallback(null);
    if (this.bgCache) {
      this.bgCache = null;
    }
  }

  private resize = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, Math.floor(rect.width));
    this.height = Math.max(180, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.buildBackground();
  };

  private handleClick(e: MouseEvent): void {
    const h = this.getHotspotAtPoint(e.clientX, e.clientY);
    if (h && this.onHotspotClick) this.onHotspotClick(h);
  }

  private handleMove(e: PointerEvent): void {
    const h = this.getHotspotAtPoint(e.clientX, e.clientY);
    this.hoveringHotspot = h ? h.id : null;
  }

  private buildBackground(): void {
    const off = document.createElement('canvas');
    off.width = Math.max(1, this.width);
    off.height = Math.max(1, this.height);
    const g = off.getContext('2d');
    if (!g) return;
    this.drawStaticScene(g, off.width, off.height);
    this.bgCache = off;
  }

  private drawStaticScene(g: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0B132B');
    grad.addColorStop(1, '#1C2541');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
      const sx = (i * 7919) % w;
      const sy = ((i * 104729) % Math.floor(h * 0.45));
      const sr = ((i * 31) % 3) * 0.4 + 0.4;
      g.globalAlpha = 0.35 + ((i * 17) % 50) / 120;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(sx, sy, sr, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    const moonX = w * 0.82;
    const moonY = h * 0.15;
    const moonR = Math.min(w, h) * 0.045;
    const mg = g.createRadialGradient(moonX, moonY, moonR * 0.2, moonX, moonY, moonR * 2.2);
    mg.addColorStop(0, 'rgba(255, 249, 220, 0.35)');
    mg.addColorStop(1, 'rgba(255, 249, 220, 0)');
    g.fillStyle = mg;
    g.beginPath();
    g.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#FFF3B0';
    g.beginPath();
    g.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    g.fill();

    const baseY = h * 0.55;
    this.drawSkyline(g, 0, baseY - h * 0.28, w, h * 0.3, '#1A2344', h);
    this.drawSkyline(g, 0, baseY - h * 0.2, w, h * 0.28, '#121A36', h);

    const groundY = h * 0.72;
    const roadGrad = g.createLinearGradient(0, groundY, 0, h);
    roadGrad.addColorStop(0, '#1a1f3a');
    roadGrad.addColorStop(1, '#0d1126');
    g.fillStyle = roadGrad;
    g.fillRect(0, groundY, w, h - groundY);

    g.strokeStyle = 'rgba(255, 217, 61, 0.25)';
    g.lineWidth = 2;
    g.setLineDash([18, 14]);
    g.beginPath();
    g.moveTo(0, groundY + (h - groundY) * 0.5);
    g.lineTo(w, groundY + (h - groundY) * 0.5);
    g.stroke();
    g.setLineDash([]);

    const lampPositions = [
      { x: 0.18, y: 0.46 },
      { x: 0.5, y: 0.38 },
      { x: 0.82, y: 0.5 },
    ];
    for (const p of lampPositions) {
      this.drawLampPost(g, w * p.x, h * p.y, w, h);
    }

    for (const p of lampPositions) {
      const x = w * p.x;
      const y = h * p.y;
      const radius = Math.min(w, h) * 0.18;
      const glow = g.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, 'rgba(255, 217, 61, 0.5)');
      glow.addColorStop(0.5, 'rgba(255, 217, 61, 0.18)');
      glow.addColorStop(1, 'rgba(255, 217, 61, 0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, radius, 0, Math.PI * 2);
      g.fill();
    }

    const puddles = [
      { x: 0.32, y: 0.84, w: 0.08, h: 0.015 },
      { x: 0.58, y: 0.9, w: 0.06, h: 0.012 },
    ];
    for (const p of puddles) {
      const pg = g.createRadialGradient(w * p.x, h * p.y, 0, w * p.x, h * p.y, w * p.w);
      pg.addColorStop(0, 'rgba(160, 196, 255, 0.15)');
      pg.addColorStop(1, 'rgba(160, 196, 255, 0)');
      g.fillStyle = pg;
      g.beginPath();
      g.ellipse(w * p.x, h * p.y, w * p.w, h * p.h, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  private drawSkyline(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    _H: number,
  ): void {
    g.fillStyle = color;
    const seed = color.charCodeAt(1);
    g.beginPath();
    g.moveTo(x, y + h);
    let cx = x;
    let i = 0;
    while (cx < x + w) {
      const bw = 30 + ((i * 131 + seed) % 60);
      const bh = 30 + ((i * 197 + seed) % h);
      g.lineTo(cx, y + h - bh);
      g.lineTo(cx + bw, y + h - bh);
      cx += bw;
      i++;
    }
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fill();

    const windowColor = 'rgba(255, 217, 61, 0.35)';
    g.fillStyle = windowColor;
    cx = x;
    i = 0;
    while (cx < x + w) {
      const bw = 30 + ((i * 131 + seed) % 60);
      const bh = 30 + ((i * 197 + seed) % h);
      const rows = Math.max(1, Math.floor(bh / 14));
      const cols = Math.max(1, Math.floor(bw / 12));
      for (let r = 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (((i * 31 + r * 7 + c * 13 + seed) % 5) === 0) {
            g.fillRect(cx + 4 + c * 10, y + h - bh + 6 + r * 14, 4, 6);
          }
        }
      }
      cx += bw;
      i++;
    }
  }

  private drawLampPost(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const postH = h * 0.28;
    const postW = Math.max(3, w * 0.006);
    g.fillStyle = '#2a2f4a';
    g.fillRect(x - postW / 2, y, postW, postH);
    g.fillStyle = '#FFD93D';
    g.beginPath();
    g.arc(x, y, Math.max(6, w * 0.014), 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#FFE580';
    g.beginPath();
    g.arc(x, y, Math.max(3, w * 0.006), 0, Math.PI * 2);
    g.fill();
  }

  private loop(): void {
    if (!this.running) return;
    const t = (performance.now() - this.startTime) / 1000;
    this.pulse = t;
    this.render(t);
    this.rafId = requestAnimationFrame(this.loop);
  }

  private render(t: number): void {
    const { ctx, width, height } = this;
    if (!this.bgCache) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.bgCache, 0, 0, width, height);

    const levelBoost = 1 + this.audioLevel * 0.6;
    for (const h of HOT_SPOTS) {
      const x = width * h.x;
      const y = height * h.y;
      const baseR = Math.max(18, Math.min(width, height) * 0.032);
      const breathing = 1 + Math.sin(t * (Math.PI * 2) / 2.5 + h.x * 10) * 0.05;
      const r = baseR * breathing * levelBoost;
      const isHover = this.hoveringHotspot === h.id;

      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      halo.addColorStop(0, CATEGORY_COLORS[h.category] + 'cc');
      halo.addColorStop(1, CATEGORY_COLORS[h.category] + '00');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4 * (isHover ? 1.2 : 1), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isHover ? '#FFD93D' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = CATEGORY_COLORS[h.category];
      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0B132B';
      ctx.font = `600 ${Math.max(10, Math.floor(r * 0.7))}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(h.label[0]), x, y);
    }

    if (this.audioLevel > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255, 217, 61, ${Math.min(0.4, this.audioLevel * 0.6)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rr = (t * 80 + i * 60) % 140;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.92, rr, 0, Math.PI * 2);
        ctx.globalAlpha = Math.max(0, 0.4 - rr / 180) * this.audioLevel;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
