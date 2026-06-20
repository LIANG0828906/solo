import TWEEN from '@tweenjs/tween.js';
import type { ColorTheme } from '../types';

const colorThemes: Record<ColorTheme | 'default', string[]> = {
  aurora: ['#00ff87', '#60efff', '#0066ff'],
  lava: ['#ff4500', '#ff8c00', '#ffd700'],
  neon: ['#ff00ff', '#00ffff', '#ffff00'],
  default: ['#00d4ff', '#0077b6', '#003d5b'],
};

export class ParticleEffect {
  private particleCount: number;
  private trailLength: number = 20;
  private trailHistory: Float32Array[][];
  private flickerState: boolean[];
  private flickerIntensity: Float32Array;
  private currentTheme: ColorTheme | 'default' = 'default';
  private colorTransitionProgress: number = 1;
  private currentColors: Float32Array;
  private targetColors: Float32Array;
  private baseColors: Float32Array;

  constructor(particleCount: number) {
    this.particleCount = particleCount;
    this.trailHistory = Array.from({ length: particleCount }, () => []);
    this.flickerState = new Array(particleCount).fill(false);
    this.flickerIntensity = new Float32Array(particleCount);
    this.currentColors = new Float32Array(particleCount * 3);
    this.targetColors = new Float32Array(particleCount * 3);
    this.baseColors = new Float32Array(particleCount * 3);

    const themeColors = this.getThemeColors(this.currentTheme);
    for (let i = 0; i < particleCount; i++) {
      const t = i / Math.max(particleCount - 1, 1);
      const colorIndex = Math.floor(t * (themeColors.length - 1));
      const localT = (t * (themeColors.length - 1)) % 1;
      const color1 = this.hexToRgb(themeColors[colorIndex]);
      const color2 = this.hexToRgb(themeColors[Math.min(colorIndex + 1, themeColors.length - 1)]);
      const color = this.lerpColor(color1, color2, localT);
      this.baseColors[i * 3] = color[0];
      this.baseColors[i * 3 + 1] = color[1];
      this.baseColors[i * 3 + 2] = color[2];
      this.currentColors[i * 3] = color[0];
      this.currentColors[i * 3 + 1] = color[1];
      this.currentColors[i * 3 + 2] = color[2];
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
      : [1, 1, 1];
  }

  private lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  private getThemeColors(theme: ColorTheme | 'default'): string[] {
    return colorThemes[theme];
  }

  updateTrails(currentPositions: Float32Array): void {
    for (let i = 0; i < this.particleCount; i++) {
      const position = new Float32Array(3);
      position[0] = currentPositions[i * 3];
      position[1] = currentPositions[i * 3 + 1];
      position[2] = currentPositions[i * 3 + 2];
      this.trailHistory[i].push(position);
      if (this.trailHistory[i].length > this.trailLength) {
        this.trailHistory[i].shift();
      }
    }
  }

  updateFlicker(_deltaTime: number): void {
    for (let i = 0; i < this.particleCount; i++) {
      if (!this.flickerState[i] && Math.random() < 0.2) {
        this.flickerState[i] = true;
        new TWEEN.Tween(this.flickerIntensity)
          .to({ [i]: 1 }, 50)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onComplete(() => {
            new TWEEN.Tween(this.flickerIntensity)
              .to({ [i]: 0 }, 50)
              .easing(TWEEN.Easing.Quadratic.In)
              .onComplete(() => {
                this.flickerState[i] = false;
              })
              .start();
          })
          .start();
      }
    }
  }

  transitionColorTheme(theme: ColorTheme): void {
    const themeColors = this.getThemeColors(theme);
    for (let i = 0; i < this.particleCount; i++) {
      const t = i / Math.max(this.particleCount - 1, 1);
      const colorIndex = Math.floor(t * (themeColors.length - 1));
      const localT = (t * (themeColors.length - 1)) % 1;
      const color1 = this.hexToRgb(themeColors[colorIndex]);
      const color2 = this.hexToRgb(themeColors[Math.min(colorIndex + 1, themeColors.length - 1)]);
      const color = this.lerpColor(color1, color2, localT);
      this.targetColors[i * 3] = color[0];
      this.targetColors[i * 3 + 1] = color[1];
      this.targetColors[i * 3 + 2] = color[2];
      this.baseColors[i * 3] = this.currentColors[i * 3];
      this.baseColors[i * 3 + 1] = this.currentColors[i * 3 + 1];
      this.baseColors[i * 3 + 2] = this.currentColors[i * 3 + 2];
    }
    this.currentTheme = theme;
    this.colorTransitionProgress = 0;
    new TWEEN.Tween({ progress: 0 })
      .to({ progress: 1 }, 1500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((obj) => {
        this.colorTransitionProgress = obj.progress;
      })
      .start();
  }

  update(deltaTime: number): void {
    this.updateFlicker(deltaTime);
    if (this.colorTransitionProgress < 1) {
      const t = this.colorTransitionProgress;
      for (let i = 0; i < this.particleCount * 3; i++) {
        this.currentColors[i] = this.baseColors[i] + (this.targetColors[i] - this.baseColors[i]) * t;
      }
    }
  }

  getTrailOpacity(index: number): number {
    return 0.7 * (1 - index / this.trailLength);
  }

  getSizeMultiplier(index: number): number {
    return 1 + this.flickerIntensity[index] * 0.5;
  }

  getColors(): Float32Array {
    return this.currentColors;
  }
}
