import { SonarPulseAnimation, Particle, PULSE_DURATION } from '@/types';
import { generateId, lerp } from '@/utils/arrayHelpers';

export class SonarPulse {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private activePulse: SonarPulseAnimation | null = null;
  private particles: Particle[] = [];
  private gridSize: number;
  private cellSize: number;
  private padding: number = 10;
  private onComplete?: (pulseId: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    gridSize: number = 10,
    cellSize: number = 40,
    onComplete?: (pulseId: string) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.onComplete = onComplete;
    this.resize();
  }

  public resize(cellSize?: number): void {
    if (cellSize) this.cellSize = cellSize;
    const size = this.gridSize * this.cellSize + this.padding * 2;
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
  }

  public startPulse(
    gridX: number,
    gridY: number,
    isHit: boolean = false,
    duration: number = PULSE_DURATION
  ): string {
    const pulseId = generateId();
    const centerX = this.padding + gridX * this.cellSize + this.cellSize / 2;
    const centerY = this.padding + gridY * this.cellSize + this.cellSize / 2;

    this.activePulse = {
      id: pulseId,
      x: centerX,
      y: centerY,
      startTime: performance.now(),
      duration,
      isHit,
      particles: [],
    };

    if (!this.animationId) {
      this.animate();
    }

    return pulseId;
  }

  public triggerParticles(centerX: number, centerY: number, count: number = 10): void {
    const canvasX = this.padding + centerX * this.cellSize + this.cellSize / 2;
    const canvasY = this.padding + centerY * this.cellSize + this.cellSize / 2;

    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 2;
        this.particles.push({
          id: generateId(),
          x: canvasX,
          y: canvasY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          startTime: performance.now(),
          duration: 300,
        });
      }
    }, 1400);
  }

  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const now = performance.now();
    let shouldContinue = false;

    if (this.activePulse) {
      const elapsed = now - this.activePulse.startTime;
      const progress = Math.min(elapsed / this.activePulse.duration, 1);

      if (progress < 1) {
        this.drawPulseWave(this.activePulse, progress);
        this.drawCenterDot(this.activePulse, progress);
        shouldContinue = true;
      } else {
        if (this.onComplete) {
          this.onComplete(this.activePulse.id);
        }
        this.activePulse = null;
      }
    }

    this.particles = this.particles.filter(particle => {
      const elapsed = now - particle.startTime;
      const progress = elapsed / particle.duration;
      
      if (progress < 1) {
        this.drawParticle(particle, progress);
        particle.x += particle.vx;
        particle.y += particle.vy;
        shouldContinue = true;
        return true;
      }
      return false;
    });

    if (shouldContinue) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.animationId = null;
    }
  };

  private drawPulseWave(pulse: SonarPulseAnimation, progress: number): void {
    const maxRadius = this.cellSize * 4;
    const radius = lerp(0, maxRadius, progress);
    const opacity = lerp(0.8, 0, progress);
    const lineWidth = lerp(4, 1, progress);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();

    if (progress > 0.3 && progress < 0.9) {
      const innerRadius = lerp(0, maxRadius * 0.7, progress - 0.3);
      const innerOpacity = lerp(0, 0.4, progress - 0.3) * (1 - (progress - 0.3) / 0.6);
      this.ctx.beginPath();
      this.ctx.arc(pulse.x, pulse.y, innerRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${innerOpacity})`;
      this.ctx.lineWidth = lineWidth * 0.6;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawCenterDot(pulse: SonarPulseAnimation, progress: number): void {
    if (progress < 0.3) {
      const dotProgress = progress / 0.3;
      const dotRadius = 3 + Math.sin(dotProgress * Math.PI) * 2;
      const dotOpacity = 1 - dotProgress * 0.5;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(pulse.x, pulse.y, dotRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${dotOpacity})`;
      this.ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawParticle(particle: Particle, progress: number): void {
    const opacity = 1 - progress;
    const size = 2 * (1 - progress * 0.5);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    this.ctx.shadowBlur = 8;
    this.ctx.fill();
    this.ctx.restore();
  }

  public clear(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.activePulse = null;
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public getActivePulseId(): string | null {
    return this.activePulse?.id || null;
  }

  public destroy(): void {
    this.clear();
  }
}
