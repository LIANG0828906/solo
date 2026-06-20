import { LightSource } from './lightSource';
import { Mirror } from './mirror';
import { RGBColor, RaySegment, CANVAS_WIDTH, CANVAS_HEIGHT, Point } from './types';

export interface RendererSettings {
  showRayPaths: boolean;
  mirrorOpacity: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  public lights: LightSource[];
  public mirrors: Mirror[];
  public settings: RendererSettings;
  public selectedObjectId: number | null = null;
  public hoveredObjectId: number | null = null;

  private colorBufferCanvas: HTMLCanvasElement;
  private colorBufferCtx: CanvasRenderingContext2D;
  private cachedLightSegments: Map<number, RaySegment[]> = new Map();
  private cachedFrameId: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    lights: LightSource[],
    mirrors: Mirror[],
    settings: RendererSettings
  ) {
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.lights = lights;
    this.mirrors = mirrors;
    this.settings = settings;

    this.colorBufferCanvas = document.createElement('canvas');
    this.colorBufferCanvas.width = CANVAS_WIDTH;
    this.colorBufferCanvas.height = CANVAS_HEIGHT;
    this.colorBufferCtx = this.colorBufferCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  clear(): void {
    this.ctx.fillStyle = '#0f0f1e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawGrid();
  }

  private drawGrid(): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= CANVAS_WIDTH; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  computeSceneHash(): string {
    const parts: string[] = [];
    for (const l of this.lights) {
      parts.push(`L${l.id}:${l.x},${l.y},${l.angle},${l.coneAngle},${l.color.r}${l.color.g}${l.color.b},${l.enabled ? 1 : 0}`);
    }
    for (const m of this.mirrors) {
      parts.push(`M${m.id}:${m.x},${m.y},${m.angle},${m.shape}`);
    }
    parts.push(`S:${this.settings.showRayPaths ? 1 : 0},${this.settings.mirrorOpacity}`);
    parts.push(`Sel:${this.selectedObjectId ?? -1}`);
    parts.push(`Hov:${this.hoveredObjectId ?? -1}`);
    return parts.join('|');
  }

  render(): void {
    this.cachedFrameId++;
    this.clear();

    this.colorBufferCtx.globalCompositeOperation = 'source-over';
    this.colorBufferCtx.fillStyle = 'rgba(0,0,0,0)';
    this.colorBufferCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.cachedLightSegments.clear();
    for (const light of this.lights) {
      if (!light.enabled) continue;
      const segments = light.traceRays(this.mirrors);
      this.cachedLightSegments.set(light.id, segments);
      this.drawLightToColorBuffer(light, segments);
    }

    this.drawBlendedLightBeams();

    if (this.settings.showRayPaths) {
      this.drawRayPaths();
    }

    this.drawMirrors();
    this.drawLightSources();

    this.drawIntersectionHighlight();
  }

  private drawLightToColorBuffer(_light: LightSource, segments: RaySegment[]): void {
    const ctx = this.colorBufferCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (const seg of segments) {
      const len = Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
      if (len < 1) continue;
      const intensity = seg.intensity;

      ctx.beginPath();
      ctx.moveTo(seg.start.x, seg.start.y);
      ctx.lineTo(seg.end.x, seg.end.y);
      ctx.strokeStyle = `rgba(${seg.color.r},${seg.color.g},${seg.color.b},${0.05 * intensity})`;
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(seg.start.x, seg.start.y);
      ctx.lineTo(seg.end.x, seg.end.y);
      ctx.strokeStyle = `rgba(${seg.color.r},${seg.color.g},${seg.color.b},${0.12 * intensity})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBlendedLightBeams(): void {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = true;

    this.ctx.globalCompositeOperation = 'lighter';

    this.ctx.filter = 'blur(10px)';
    this.ctx.globalAlpha = 0.5;
    this.ctx.drawImage(this.colorBufferCanvas, 0, 0);

    this.ctx.filter = 'blur(4px)';
    this.ctx.globalAlpha = 0.4;
    this.ctx.drawImage(this.colorBufferCanvas, 0, 0);

    this.ctx.filter = 'none';
    this.ctx.globalAlpha = 0.3;
    this.ctx.drawImage(this.colorBufferCanvas, 0, 0);

    this.ctx.restore();
  }

  private drawRayPaths(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [, segments] of this.cachedLightSegments) {
      for (const seg of segments) {
        const intensity = seg.intensity;
        ctx.beginPath();
        ctx.moveTo(seg.start.x, seg.start.y);
        ctx.lineTo(seg.end.x, seg.end.y);
        ctx.strokeStyle = `rgba(${seg.color.r},${seg.color.g},${seg.color.b},${0.55 * intensity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    for (const light of this.lights) {
      if (!light.enabled) continue;
      const segments = this.cachedLightSegments.get(light.id) || [];
      for (const seg of segments) {
        const pts = this.getMidPoints(seg, 8);
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${seg.color.r},${seg.color.g},${seg.color.b},${0.7 * seg.intensity})`;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  private getMidPoints(seg: RaySegment, count: number): Point[] {
    const res: Point[] = [];
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      res.push({
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t
      });
    }
    return res;
  }

  private drawMirrors(): void {
    for (const mirror of this.mirrors) {
      const showHandles = this.selectedObjectId === mirror.id || this.hoveredObjectId === mirror.id;
      mirror.draw(this.ctx, this.lights, showHandles, this.settings.mirrorOpacity);
      if (this.selectedObjectId === mirror.id) {
        this.drawSelectionOutline(mirror);
      }
    }
  }

  private drawSelectionOutline(mirror: Mirror): void {
    const corners = mirror.getCorners();
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const c of corners) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  private drawLightSources(): void {
    for (const light of this.lights) {
      const showHandles = this.selectedObjectId === light.id || this.hoveredObjectId === light.id;
      light.draw(this.ctx, showHandles);
      if (this.selectedObjectId === light.id) {
        this.drawLightSelection(light);
      }
    }
  }

  private drawLightSelection(light: LightSource): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(light.x, light.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawIntersectionHighlight(): void {
    return;
  }

  sampleColorAt(x: number, y: number): RGBColor | null {
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return null;
    try {
      const image = this.colorBufferCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const r = Math.min(255, Math.round(image[0]));
      const g = Math.min(255, Math.round(image[1]));
      const b = Math.min(255, Math.round(image[2]));
      if (r < 5 && g < 5 && b < 5) return null;
      return { r, g, b };
    } catch {
      return null;
    }
  }

  getFPS(): number {
    return 60;
  }
}
