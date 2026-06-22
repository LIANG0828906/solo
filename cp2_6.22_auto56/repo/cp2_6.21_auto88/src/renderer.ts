import type { Layer, ParticleLayer, GeometryLayer, GradientLayer, LinesLayer, Polygon, BezierLine, Particle } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './state';

const BLEND_MODE_MAP: Record<string, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
};

export class WallRenderer {
  private frontCanvas: HTMLCanvasElement;
  private backCanvas: HTMLCanvasElement;
  private frontCtx: CanvasRenderingContext2D;
  private backCtx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private onFrame: ((deltaTime: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.frontCanvas = canvas;
    this.frontCtx = canvas.getContext('2d')!;

    this.backCanvas = document.createElement('canvas');
    this.backCanvas.width = CANVAS_WIDTH;
    this.backCanvas.height = CANVAS_HEIGHT;
    this.backCtx = this.backCanvas.getContext('2d')!;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }

  setFrameCallback(cb: (deltaTime: number) => void) {
    this.onFrame = cb;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 30);
    this.lastTime = now;

    if (this.onFrame) {
      this.onFrame(dt);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  render(layers: Layer[], selectedElementId: string | null, selectedLayerId: string | null, hoveredElementId: string | null = null, hoveredLayerId: string | null = null) {
    const ctx = this.backCtx;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const layer of layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode] || 'source-over';

      switch (layer.type) {
        case 'gradient':
          this.renderGradient(ctx, layer);
          break;
        case 'particles':
          this.renderParticles(ctx, layer, hoveredElementId, hoveredLayerId);
          break;
        case 'geometry':
          this.renderGeometry(ctx, layer, selectedElementId, selectedLayerId, hoveredElementId, hoveredLayerId);
          break;
        case 'lines':
          this.renderLines(ctx, layer, selectedElementId, selectedLayerId, hoveredElementId, hoveredLayerId);
          break;
      }

      ctx.restore();
    }

    this.frontCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.frontCtx.drawImage(this.backCanvas, 0, 0);

    if (selectedElementId && selectedLayerId) {
      this.renderSelectionHandles(selectedElementId, selectedLayerId, layers);
    }
  }

  private renderGradient(ctx: CanvasRenderingContext2D, layer: GradientLayer) {
    const { gradientType, angle, stops } = layer;
    let gradient: CanvasGradient;

    if (gradientType === 'linear') {
      const rad = (angle * Math.PI) / 180;
      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2;
      const len = Math.sqrt(CANVAS_WIDTH ** 2 + CANVAS_HEIGHT ** 2) / 2;
      const x1 = cx - Math.cos(rad) * len;
      const y1 = cy - Math.sin(rad) * len;
      const x2 = cx + Math.cos(rad) * len;
      const y2 = cy + Math.sin(rad) * len;
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      gradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) / 1.5
      );
    }

    for (const stop of stops) {
      gradient.addColorStop(Math.max(0, Math.min(1, stop.position)), stop.color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private renderParticles(ctx: CanvasRenderingContext2D, layer: ParticleLayer, hoveredElementId: string | null, hoveredLayerId: string | null) {
    for (const p of layer.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      if (hoveredLayerId === layer.id && hoveredElementId === p.id) {
        this.drawParticleHoverGlow(ctx, p);
      }
    }
  }

  private drawParticleHoverGlow(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  }

  private renderGeometry(
    ctx: CanvasRenderingContext2D,
    layer: GeometryLayer,
    selectedElementId: string | null,
    selectedLayerId: string | null,
    hoveredElementId: string | null,
    hoveredLayerId: string | null
  ) {
    for (const poly of layer.polygons) {
      this.drawPolygon(ctx, poly);

      if (hoveredLayerId === layer.id && hoveredElementId === poly.id && !(selectedLayerId === layer.id && selectedElementId === poly.id)) {
        this.drawPolygonHoverGlow(ctx, poly);
      }

      if (selectedLayerId === layer.id && selectedElementId === poly.id) {
        this.drawSelectionGlow(ctx, poly);
      }
    }
  }

  private drawPolygonHoverGlow(ctx: CanvasRenderingContext2D, poly: Polygon) {
    ctx.save();
    ctx.translate(poly.x, poly.y);
    ctx.rotate(poly.rotation);

    ctx.beginPath();
    for (let i = 0; i < poly.sides; i++) {
      const angle = (i * 2 * Math.PI) / poly.sides - Math.PI / 2;
      const x = Math.cos(angle) * (poly.radius + 8);
      const y = Math.sin(angle) * (poly.radius + 8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
    ctx.shadowBlur = 16;
    ctx.stroke();

    ctx.restore();
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, poly: Polygon) {
    ctx.save();
    ctx.translate(poly.x, poly.y);
    ctx.rotate(poly.rotation);

    ctx.beginPath();
    for (let i = 0; i < poly.sides; i++) {
      const angle = (i * 2 * Math.PI) / poly.sides - Math.PI / 2;
      const x = Math.cos(angle) * poly.radius;
      const y = Math.sin(angle) * poly.radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.globalAlpha = poly.fillOpacity;
    ctx.fillStyle = poly.fillColor;
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = poly.strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  private drawSelectionGlow(ctx: CanvasRenderingContext2D, poly: Polygon) {
    ctx.save();
    ctx.translate(poly.x, poly.y);
    ctx.rotate(poly.rotation);

    const t = performance.now() / 500;
    const glowSize = 6 + Math.sin(t) * 3;

    ctx.beginPath();
    for (let i = 0; i < poly.sides; i++) {
      const angle = (i * 2 * Math.PI) / poly.sides - Math.PI / 2;
      const x = Math.cos(angle) * (poly.radius + glowSize);
      const y = Math.sin(angle) * (poly.radius + glowSize);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = 'rgba(79, 195, 247, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4fc3f7';
    ctx.shadowBlur = 20;
    ctx.stroke();

    ctx.restore();
  }

  private renderLines(
    ctx: CanvasRenderingContext2D,
    layer: LinesLayer,
    selectedElementId: string | null,
    selectedLayerId: string | null,
    hoveredElementId: string | null,
    hoveredLayerId: string | null
  ) {
    for (const line of layer.lines) {
      ctx.save();
      ctx.globalAlpha = line.opacity * (layer.lineOpacity / 100);
      ctx.beginPath();
      ctx.moveTo(line.startX, line.startY);
      ctx.bezierCurveTo(line.cp1x, line.cp1y, line.cp2x, line.cp2y, line.endX, line.endY);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.thickness * layer.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      if (hoveredLayerId === layer.id && hoveredElementId === line.id && !(selectedLayerId === layer.id && selectedElementId === line.id)) {
        this.drawLineHoverGlow(ctx, line);
      }

      if (selectedLayerId === layer.id && selectedElementId === line.id) {
        this.drawLineSelection(ctx, line);
      }
    }
  }

  private drawLineHoverGlow(ctx: CanvasRenderingContext2D, line: BezierLine) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(line.startX, line.startY);
    ctx.bezierCurveTo(line.cp1x, line.cp1y, line.cp2x, line.cp2y, line.endX, line.endY);
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
    ctx.lineWidth = line.thickness * 2 + 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  private drawLineSelection(ctx: CanvasRenderingContext2D, line: BezierLine) {
    const midX = (line.startX + line.endX) / 2;
    const midY = (line.startY + line.endY) / 2;
    const t = performance.now() / 500;
    const glowSize = 8 + Math.sin(t) * 3;

    ctx.save();
    ctx.beginPath();
    ctx.arc(midX, midY, glowSize, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.9)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4fc3f7';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();
  }

  private renderSelectionHandles(
    selectedElementId: string,
    selectedLayerId: string,
    layers: Layer[]
  ) {
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (!layer) return;

    let bounds: { x: number; y: number; width: number; height: number; rotation?: number } | null = null;

    if (layer.type === 'geometry') {
      const poly = layer.polygons.find((p) => p.id === selectedElementId);
      if (poly) {
        bounds = {
          x: poly.x - poly.radius - 10,
          y: poly.y - poly.radius - 10,
          width: poly.radius * 2 + 20,
          height: poly.radius * 2 + 20,
          rotation: poly.rotation,
        };
      }
    } else if (layer.type === 'particles') {
      const p = layer.particles.find((pt) => pt.id === selectedElementId);
      if (p) {
        bounds = {
          x: p.x - p.size - 10,
          y: p.y - p.size - 10,
          width: p.size * 2 + 20,
          height: p.size * 2 + 20,
        };
      }
    } else if (layer.type === 'lines') {
      const line = layer.lines.find((l) => l.id === selectedElementId);
      if (line) {
        const minX = Math.min(line.startX, line.endX, line.cp1x, line.cp2x) - 10;
        const maxX = Math.max(line.startX, line.endX, line.cp1x, line.cp2x) + 10;
        const minY = Math.min(line.startY, line.endY, line.cp1y, line.cp2y) - 10;
        const maxY = Math.max(line.startY, line.endY, line.cp1y, line.cp2y) + 10;
        bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
    }

    if (!bounds) return;

    const ctx = this.frontCtx;
    ctx.save();
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.setLineDash([]);

    const handleSize = 10;
    const handles = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width / 2, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height / 2 },
    ];

    for (const h of handles) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(79, 195, 247, 1)';
      ctx.lineWidth = 2;
      ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    }

    // Rotation handle
    const rotX = bounds.x + bounds.width / 2;
    const rotY = bounds.y - 30;
    ctx.beginPath();
    ctx.arc(rotX, rotY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Connecting line
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
    ctx.lineTo(rotX, rotY + 8);
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  hitTest(
    x: number,
    y: number,
    layers: Layer[]
  ): { elementId: string; layerId: string; layerIndex: number } | null {
    let bestHit: { elementId: string; layerId: string; layerIndex: number; depth: number; size: number } | null = null;

    for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex--) {
      const layer = layers[layerIndex];
      if (!layer.visible) continue;

      const layerDepth = layerIndex;

      if (layer.type === 'geometry') {
        for (let j = layer.polygons.length - 1; j >= 0; j--) {
          const poly = layer.polygons[j];
          const dx = x - poly.x;
          const dy = y - poly.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= poly.radius + 5) {
            const priority = layerDepth * 10000 + poly.radius;
            if (!bestHit || priority > bestHit.depth * 10000 + bestHit.size) {
              bestHit = { elementId: poly.id, layerId: layer.id, layerIndex, depth: layerDepth, size: poly.radius };
            }
          }
        }
      } else if (layer.type === 'particles') {
        for (let j = layer.particles.length - 1; j >= 0; j--) {
          const p = layer.particles[j];
          const dx = x - p.x;
          const dy = y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= p.size + 5) {
            const priority = layerDepth * 10000 + p.size;
            if (!bestHit || priority > bestHit.depth * 10000 + bestHit.size) {
              bestHit = { elementId: p.id, layerId: layer.id, layerIndex, depth: layerDepth, size: p.size };
            }
          }
        }
      } else if (layer.type === 'lines') {
        for (let j = layer.lines.length - 1; j >= 0; j--) {
          const l = layer.lines[j];
          const midX = (l.startX + l.endX) / 2;
          const midY = (l.startY + l.endY) / 2;
          const dx = x - midX;
          const dy = y - midY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 25) {
            const priority = layerDepth * 10000 + 25;
            if (!bestHit || priority > bestHit.depth * 10000 + bestHit.size) {
              bestHit = { elementId: l.id, layerId: layer.id, layerIndex, depth: layerDepth, size: 25 };
            }
          }
        }
      }
    }

    if (bestHit) {
      return { elementId: bestHit.elementId, layerId: bestHit.layerId, layerIndex: bestHit.layerIndex };
    }
    return null;
  }

  drawHoverGlow(
    ctx: CanvasRenderingContext2D,
    element: Particle | Polygon | BezierLine,
    elementType: 'particle' | 'polygon' | 'line'
  ) {
    ctx.save();
    ctx.shadowColor = 'rgba(100, 180, 255, 0.7)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.lineWidth = 3;

    if (elementType === 'particle') {
      const p = element as Particle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (elementType === 'polygon') {
      const poly = element as Polygon;
      ctx.translate(poly.x, poly.y);
      ctx.rotate(poly.rotation);
      ctx.beginPath();
      for (let i = 0; i < poly.sides; i++) {
        const angle = (i * 2 * Math.PI) / poly.sides - Math.PI / 2;
        const x = Math.cos(angle) * (poly.radius + 10);
        const y = Math.sin(angle) * (poly.radius + 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (elementType === 'line') {
      const line = element as BezierLine;
      ctx.beginPath();
      ctx.moveTo(line.startX, line.startY);
      ctx.bezierCurveTo(line.cp1x, line.cp1y, line.cp2x, line.cp2y, line.endX, line.endY);
      ctx.lineWidth = line.thickness * 2 + 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  }

  getHandleAt(
    x: number,
    y: number,
    selectedElementId: string,
    selectedLayerId: string,
    layers: Layer[]
  ): 'move' | 'rotate' | null {
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (!layer) return null;

    let bounds: { x: number; y: number; width: number; height: number } | null = null;

    if (layer.type === 'geometry') {
      const poly = layer.polygons.find((p) => p.id === selectedElementId);
      if (poly) {
        bounds = {
          x: poly.x - poly.radius - 10,
          y: poly.y - poly.radius - 10,
          width: poly.radius * 2 + 20,
          height: poly.radius * 2 + 20,
        };
      }
    } else if (layer.type === 'particles') {
      const p = layer.particles.find((pt) => pt.id === selectedElementId);
      if (p) {
        bounds = {
          x: p.x - p.size - 10,
          y: p.y - p.size - 10,
          width: p.size * 2 + 20,
          height: p.size * 2 + 20,
        };
      }
    } else if (layer.type === 'lines') {
      const line = layer.lines.find((l) => l.id === selectedElementId);
      if (line) {
        const minX = Math.min(line.startX, line.endX, line.cp1x, line.cp2x) - 10;
        const maxX = Math.max(line.startX, line.endX, line.cp1x, line.cp2x) + 10;
        const minY = Math.min(line.startY, line.endY, line.cp1y, line.cp2y) - 10;
        const maxY = Math.max(line.startY, line.endY, line.cp1y, line.cp2y) + 10;
        bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
    }

    if (!bounds) return null;

    // Check rotation handle
    const rotX = bounds.x + bounds.width / 2;
    const rotY = bounds.y - 30;
    const dRot = Math.sqrt((x - rotX) ** 2 + (y - rotY) ** 2);
    if (dRot <= 12) return 'rotate';

    // Check inside bounds for move
    if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
      return 'move';
    }

    return null;
  }

  getElementCenter(
    elementId: string,
    layerId: string,
    layers: Layer[]
  ): { x: number; y: number } | null {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return null;

    if (layer.type === 'geometry') {
      const poly = layer.polygons.find((p) => p.id === elementId);
      if (poly) return { x: poly.x, y: poly.y };
    } else if (layer.type === 'particles') {
      const p = layer.particles.find((pt) => pt.id === elementId);
      if (p) return { x: p.x, y: p.y };
    } else if (layer.type === 'lines') {
      const line = layer.lines.find((l) => l.id === elementId);
      if (line) {
        return { x: (line.startX + line.endX) / 2, y: (line.startY + line.endY) / 2 };
      }
    }
    return null;
  }

  getCanvas(): HTMLCanvasElement {
    return this.frontCanvas;
  }
}
