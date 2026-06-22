'use strict';

import { DreamEngine, Particle } from './dreamEngine';

export class DreamRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: DreamEngine;
  private width: number;
  private height: number;
  private fps = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private lastTime = 0;
  private colorPulsePhase = 0;
  private colorPulsePeriod = 2;
  private collapseProgress = 0;

  constructor(canvas: HTMLCanvasElement, engine: DreamEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    this.width = canvas.width;
    this.height = canvas.height;
    this.colorPulsePeriod = 1 + Math.random() * 2;
  }

  private lerpColor(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number },
    t: number
  ): { r: number; g: number; b: number } {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t),
    };
  }

  private drawBackground(timestamp: number, _deltaTime: number): void {
    const ctx = this.ctx;

    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.7
    );

    const stability = this.engine.getStability();
    const baseBrightness = 10 + stability * 0.15;

    const alphaPulse = Math.sin(timestamp * 0.001 * 10) * 0.5 + 0.5;
    const glowAlpha = 0.02 + alphaPulse * 0.03;

    gradient.addColorStop(0, `rgba(20, 20, 40, ${baseBrightness / 100})`);
    gradient.addColorStop(0.5, `rgba(10, 10, 25, ${baseBrightness / 120})`);
    gradient.addColorStop(1, 'rgba(5, 5, 15, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const edgeGradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.3,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.7
    );
    edgeGradient.addColorStop(0, 'rgba(100, 80, 200, 0)');
    edgeGradient.addColorStop(0.7, `rgba(80, 60, 180, ${glowAlpha * 0.5})`);
    edgeGradient.addColorStop(1, `rgba(60, 40, 150, ${glowAlpha})`);

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = edgeGradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawParticle(particle: Particle, timestamp: number): void {
    const ctx = this.ctx;

    const lifeRatio = particle.life / particle.maxLife;
    const fadeIn = Math.min(1, (1 - lifeRatio) * 5);
    const fadeOut = Math.min(1, lifeRatio * 3);
    const lifeAlpha = fadeIn * fadeOut;

    const deltaPulseFreq = 2 + (particle.phase % 3);
    const alphaPulse = 0.5 + 0.5 * Math.sin(timestamp * 0.001 * deltaPulseFreq + particle.phase);
    const alpha = particle.alpha * (0.3 + alphaPulse * 0.6) * lifeAlpha;

    const sizePulse = 0.8 + 0.2 * Math.sin(timestamp * 0.002 + particle.phase * 1.5);
    const size = particle.baseSize * sizePulse;

    const white = { r: 255, g: 255, b: 255 };
    const colorT = 0.5 + 0.5 * Math.sin(
      timestamp * 0.001 * (1 / this.colorPulsePeriod) + particle.phase * 0.5
    );
    const mixedColor = this.lerpColor(particle.color, white, colorT * 0.4);

    const glowSize = size * 3;
    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      glowSize
    );

    gradient.addColorStop(0, `rgba(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b}, ${alpha})`);
    gradient.addColorStop(0.3, `rgba(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b}, 0)`);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
  }

  private drawCollapse(timestamp: number): void {
    const ctx = this.ctx;

    this.collapseProgress = Math.min(1, this.collapseProgress + 0.01);

    ctx.fillStyle = `rgba(0, 0, 0, ${this.collapseProgress * 0.95})`;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.collapseProgress > 0.5) {
      const textAlpha = (this.collapseProgress - 0.5) * 2;
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 20;
      ctx.fillText('梦境崩塌', this.width / 2, this.height / 2);
      ctx.restore();
    }
  }

  private updateFPS(timestamp: number): void {
    this.frameCount++;
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }
  }

  render(timestamp: number): void {
    const deltaTime = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0.016;
    this.lastTime = timestamp;

    if (!this.engine.isCollapsed()) {
      this.collapseProgress = Math.max(0, this.collapseProgress - 0.02);
    }

    this.updateFPS(timestamp);
    this.colorPulsePhase += deltaTime * (1 / this.colorPulsePeriod);

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground(timestamp, deltaTime);

    const particles = this.engine.getParticles();
    for (const particle of particles) {
      this.drawParticle(particle, timestamp);
    }

    if (this.engine.isCollapsed()) {
      this.drawCollapse(timestamp);
    }
  }

  getFPS(): number {
    return this.fps;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.engine.setCanvasSize(width, height);
  }

  reset(): void {
    this.collapseProgress = 0;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fps = 0;
  }
}
