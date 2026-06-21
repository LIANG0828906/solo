import * as PIXI from 'pixi.js';
import type { Particle, ColorRGB } from '../types';

export class ParticleRenderer {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private graphics: PIXI.Graphics;
  private startRgb: ColorRGB = { r: 255, g: 107, b: 53 };
  private endRgb: ColorRGB = { r: 255, g: 0, b: 0 };

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.graphics = new PIXI.Graphics();

    this.container.addChild(this.graphics);
    this.app.stage.addChild(this.container);
  }

  setColors(startColor: string, endColor: string): void {
    this.startRgb = this.hexToRgb(startColor);
    this.endRgb = this.hexToRgb(endColor);
  }

  render(particles: Particle[]): void {
    this.graphics.clear();
    this.graphics.blendMode = PIXI.BLEND_MODES.ADD;

    for (const particle of particles) {
      if (!particle.active) continue;

      const lifeRatio = 1 - particle.life / particle.maxLife;
      const color = this.lerpColor(this.startRgb, this.endRgb, lifeRatio);
      const colorNum = this.rgbToNumber(color);

      this.graphics.beginFill(colorNum, particle.alpha);
      this.graphics.drawCircle(particle.x, particle.y, particle.size / 2);
      this.graphics.endFill();

      if (particle.size > 4) {
        const glowSize = particle.size * 0.6;
        this.graphics.beginFill(colorNum, particle.alpha * 0.3);
        this.graphics.drawCircle(particle.x, particle.y, glowSize);
        this.graphics.endFill();
      }
    }
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  clear(): void {
    this.graphics.clear();
  }

  private hexToRgb(hex: string): ColorRGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }

  private lerpColor(start: ColorRGB, end: ColorRGB, t: number): ColorRGB {
    return {
      r: Math.round(start.r + (end.r - start.r) * t),
      g: Math.round(start.g + (end.g - start.g) * t),
      b: Math.round(start.b + (end.b - start.b) * t),
    };
  }

  private rgbToNumber(rgb: ColorRGB): number {
    return (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  }
}
