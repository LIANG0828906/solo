import type { Particle, Keyframe } from '../store/types';

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function interpolateParticles(
  fromParticles: Particle[],
  toParticles: Particle[],
  progress: number
): Particle[] {
  const eased = easeInOut(progress);
  const result: Particle[] = [];

  const toMap = new Map(toParticles.map((p) => [p.id, p]));
  const fromMap = new Map(fromParticles.map((p) => [p.id, p]));

  for (const from of fromParticles) {
    const to = toMap.get(from.id);
    if (to) {
      result.push({
        id: from.id,
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
        radius: from.radius + (to.radius - from.radius) * eased,
        color: progress < 0.5 ? from.color : to.color,
        opacity: from.opacity + (to.opacity - from.opacity) * eased,
        glowEnabled: progress < 0.5 ? from.glowEnabled : to.glowEnabled,
      });
    } else {
      result.push({ ...from, opacity: from.opacity * (1 - eased) });
    }
  }

  for (const to of toParticles) {
    if (!fromMap.has(to.id)) {
      result.push({ ...to, opacity: to.opacity * eased });
    }
  }

  return result;
}

export function getInterpolatedParticles(
  keyframes: Keyframe[],
  currentFrame: number
): Particle[] {
  if (keyframes.length === 0) return [];
  if (keyframes.length === 1) return JSON.parse(JSON.stringify(keyframes[0].particles));

  let prevKf = keyframes[0];
  let nextKf = keyframes[keyframes.length - 1];

  if (currentFrame <= keyframes[0].frameIndex) {
    return JSON.parse(JSON.stringify(keyframes[0].particles));
  }
  if (currentFrame >= keyframes[keyframes.length - 1].frameIndex) {
    return JSON.parse(JSON.stringify(keyframes[keyframes.length - 1].particles));
  }

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (
      currentFrame >= keyframes[i].frameIndex &&
      currentFrame < keyframes[i + 1].frameIndex
    ) {
      prevKf = keyframes[i];
      nextKf = keyframes[i + 1];
      break;
    }
  }

  const span = nextKf.frameIndex - prevKf.frameIndex;
  const progress = span === 0 ? 0 : (currentFrame - prevKf.frameIndex) / span;

  return interpolateParticles(prevKf.particles, nextKf.particles, progress);
}

export class ParticleCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private animationFrameId: number | null = null;
  private glowCanvas: HTMLCanvasElement;
  private glowCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.glowCanvas = document.createElement('canvas');
    this.glowCtx = this.glowCanvas.getContext('2d')!;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.glowCanvas.width = width;
    this.glowCanvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = '#0A0A1A';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawParticle(
    ctx: CanvasRenderingContext2D,
    particle: Particle,
    isSelected: boolean,
    zoom: number,
    panX: number,
    panY: number
  ) {
    const x = (particle.x + panX) * zoom + this.width / 2 * (1 - zoom);
    const y = (particle.y + panY) * zoom + this.height / 2 * (1 - zoom);
    const r = particle.radius * zoom;

    if (particle.glowEnabled) {
      const glowRadius = r * 3;
      const gradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowRadius);
      const baseColor = particle.color;
      const r1 = parseInt(baseColor.slice(1, 3), 16);
      const g1 = parseInt(baseColor.slice(3, 5), 16);
      const b1 = parseInt(baseColor.slice(5, 7), 16);
      gradient.addColorStop(0, `rgba(${r1},${g1},${b1},${particle.opacity * 0.3})`);
      gradient.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const rc = parseInt(particle.color.slice(1, 3), 16);
    const gc = parseInt(particle.color.slice(3, 5), 16);
    const bc = parseInt(particle.color.slice(5, 7), 16);
    gradient.addColorStop(0, `rgba(${Math.min(255, rc + 80)},${Math.min(255, gc + 80)},${Math.min(255, bc + 80)},${particle.opacity})`);
    gradient.addColorStop(0.6, `rgba(${rc},${gc},${bc},${particle.opacity})`);
    gradient.addColorStop(1, `rgba(${rc},${gc},${bc},${particle.opacity * 0.4})`);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2 * zoom;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, r + 4 * zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawCrosshair(
    ctx: CanvasRenderingContext2D,
    particle: Particle,
    zoom: number,
    panX: number,
    panY: number
  ) {
    const x = (particle.x + panX) * zoom + this.width / 2 * (1 - zoom);
    const y = (particle.y + panY) * zoom + this.height / 2 * (1 - zoom);

    ctx.save();
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();

    ctx.restore();
  }

  render(
    particles: Particle[],
    selectedId: string | null,
    zoom: number,
    panOffset: { x: number; y: number },
    isMoving: boolean = false
  ) {
    this.clear();

    for (const particle of particles) {
      const isSelected = particle.id === selectedId;
      if (isSelected && isMoving) {
        this.drawCrosshair(this.ctx, particle, zoom, panOffset.x, panOffset.y);
      }
      this.drawParticle(this.ctx, particle, isSelected, zoom, panOffset.x, panOffset.y);
    }
  }

  renderPreview(
    particles: Particle[],
    zoom: number,
    panOffset: { x: number; y: number }
  ) {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (const particle of particles) {
      this.drawParticle(this.ctx, particle, false, zoom, panOffset.x, panOffset.y);
    }
  }

  hitTest(
    clickX: number,
    clickY: number,
    particles: Particle[],
    zoom: number,
    panOffset: { x: number; y: number }
  ): Particle | null {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const canvasX = (clickX - rect.left) * scaleX;
    const canvasY = (clickY - rect.top) * scaleY;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const px = (p.x + panOffset.x) * zoom + this.width / 2 * (1 - zoom);
      const py = (p.y + panOffset.y) * zoom + this.height / 2 * (1 - zoom);
      const r = p.radius * zoom;
      const dx = canvasX - px;
      const dy = canvasY - py;
      if (dx * dx + dy * dy <= (r + 4) * (r + 4)) {
        return p;
      }
    }
    return null;
  }

  screenToCanvas(
    screenX: number,
    screenY: number,
    zoom: number,
    panOffset: { x: number; y: number }
  ): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const canvasX = (screenX - rect.left) * scaleX;
    const canvasY = (screenY - rect.top) * scaleY;

    return {
      x: (canvasX - this.width / 2 * (1 - zoom)) / zoom - panOffset.x,
      y: (canvasY - this.height / 2 * (1 - zoom)) / zoom - panOffset.y,
    };
  }

  exportFrame(
    particles: Particle[],
    zoom: number,
    panOffset: { x: number; y: number },
    isPreview: boolean
  ): string {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.width;
    exportCanvas.height = this.height;
    const ctx = exportCanvas.getContext('2d')!;

    ctx.fillStyle = isPreview ? '#000000' : '#0A0A1A';
    ctx.fillRect(0, 0, this.width, this.height);

    for (const particle of particles) {
      const x = (particle.x + panOffset.x) * zoom + this.width / 2 * (1 - zoom);
      const y = (particle.y + panOffset.y) * zoom + this.height / 2 * (1 - zoom);
      const r = particle.radius * zoom;

      if (particle.glowEnabled) {
        const glowRadius = r * 3;
        const gradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowRadius);
        const rc = parseInt(particle.color.slice(1, 3), 16);
        const gc = parseInt(particle.color.slice(3, 5), 16);
        const bc = parseInt(particle.color.slice(5, 7), 16);
        gradient.addColorStop(0, `rgba(${rc},${gc},${bc},${particle.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      const rc = parseInt(particle.color.slice(1, 3), 16);
      const gc = parseInt(particle.color.slice(3, 5), 16);
      const bc = parseInt(particle.color.slice(5, 7), 16);
      gradient.addColorStop(0, `rgba(${Math.min(255, rc + 80)},${Math.min(255, gc + 80)},${Math.min(255, bc + 80)},${particle.opacity})`);
      gradient.addColorStop(0.6, `rgba(${rc},${gc},${bc},${particle.opacity})`);
      gradient.addColorStop(1, `rgba(${rc},${gc},${bc},${particle.opacity * 0.4})`);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    return exportCanvas.toDataURL('image/png');
  }

  startAnimationLoop(
    callback: (timestamp: number) => void
  ) {
    const loop = (timestamp: number) => {
      callback(timestamp);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopAnimationLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
