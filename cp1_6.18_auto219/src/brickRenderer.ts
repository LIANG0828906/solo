import type { BandEnergy } from './audioAnalyzer';

interface BrickState {
  baseColor: string;
  glowIntensity: number;
  glowStartTime: number;
  glowColumn: number;
  lastBeatTime: number;
}

const GRID_SIZE = 8;
const BRICK_SIZE = 50;
const LEAD_SIZE = 2;
const GLOW_SPREAD_DURATION = 20;
const GLOW_FADE_DURATION = 250;
const TOTAL_GLOW_DURATION = GLOW_SPREAD_DURATION + GLOW_FADE_DURATION;

const BASE_COLORS = [
  '#4A7C6F',
  '#8B6B4A',
  '#6A4A78',
  '#5A6B7A',
  '#7A6B5A',
  '#4A6A7C',
  '#6B5A7A',
  '#5A7A6B',
];

type BandCategory = 'low' | 'mid' | 'high';

const BAND_CATEGORY_COLORS: Record<BandCategory, [string, string]> = {
  low: ['#FF4500', '#FF6347'],
  mid: ['#FFD700', '#FFB6C1'],
  high: ['#00CED1', '#87CEFA'],
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}

export class BrickRenderer {
  private ctx: CanvasRenderingContext2D;
  private bricks: BrickState[][] = [];
  private canvasSize: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;
    this.canvasSize = GRID_SIZE * BRICK_SIZE + (GRID_SIZE + 1) * LEAD_SIZE;
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;
    this.initBricks();
    this.render();
  }

  private initBricks(): void {
    this.bricks = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const rowBricks: BrickState[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const colorIndex = (row * 3 + col * 5 + row * col) % BASE_COLORS.length;
        rowBricks.push({
          baseColor: BASE_COLORS[colorIndex],
          glowIntensity: 0,
          glowStartTime: -1,
          glowColumn: col,
          lastBeatTime: -1000,
        });
      }
      this.bricks.push(rowBricks);
    }
  }

  update(bandEnergies: BandEnergy[]): void {
    const now = performance.now();

    for (const bandEnergy of bandEnergies) {
      if (bandEnergy.isBeat) {
        const columns = this.getColumnsForBand(bandEnergy.band);
        for (const col of columns) {
          for (let row = 0; row < GRID_SIZE; row++) {
            const brick = this.bricks[row][col];
            if (now - brick.lastBeatTime > 150) {
              const intensityBoost = 0.4 + bandEnergy.energy * 0.6;
              const rowFactor = 1 - (row / GRID_SIZE) * 0.3;
              brick.glowIntensity = Math.min(1, intensityBoost * rowFactor);
              brick.glowStartTime = now;
              brick.glowColumn = col;
              brick.lastBeatTime = now;
            }
          }
        }
      }
    }

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const brick = this.bricks[row][col];
        if (brick.glowStartTime >= 0) {
          const elapsed = now - brick.glowStartTime;
          if (elapsed >= TOTAL_GLOW_DURATION) {
            brick.glowIntensity = 0;
            brick.glowStartTime = -1;
          }
        }
      }
    }
  }

  private getColumnsForBand(band: number): number[] {
    switch (band) {
      case 0: return [0, 1];
      case 1: return [1, 2];
      case 2: return [2, 3];
      case 3: return [3, 4];
      case 4: return [4, 5];
      case 5: return [5, 6];
      case 6: return [6, 7];
      case 7: return [6, 7];
      default: return [band];
    }
  }

  render(): void {
    const ctx = this.ctx;
    const now = performance.now();

    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const brick = this.bricks[row][col];
        const x = LEAD_SIZE + col * (BRICK_SIZE + LEAD_SIZE);
        const y = LEAD_SIZE + row * (BRICK_SIZE + LEAD_SIZE);

        let intensity = 0;
        let spreadProgress = 1;

        if (brick.glowStartTime >= 0) {
          const elapsed = now - brick.glowStartTime;
          if (elapsed < TOTAL_GLOW_DURATION) {
            if (elapsed < GLOW_SPREAD_DURATION) {
              spreadProgress = easeOutQuad(elapsed / GLOW_SPREAD_DURATION);
              intensity = brick.glowIntensity * spreadProgress;
            } else {
              const fadeProgress = (elapsed - GLOW_SPREAD_DURATION) / GLOW_FADE_DURATION;
              intensity = brick.glowIntensity * (1 - easeInQuad(fadeProgress));
              spreadProgress = 1;
            }
          }
        }

        this.drawBrick(x, y, brick, intensity, spreadProgress, col);
      }
    }
  }

  private drawBrick(
    x: number,
    y: number,
    brick: BrickState,
    intensity: number,
    spreadProgress: number,
    col: number
  ): void {
    const ctx = this.ctx;
    const size = BRICK_SIZE;
    const bandCategory = this.getBandCategoryForColumn(col);
    const glowColors = BAND_CATEGORY_COLORS[bandCategory];

    const glowColor1 = lerpColor(glowColors[0], glowColors[1], col / GRID_SIZE);
    const displayColor = intensity > 0
      ? this.blendColors(brick.baseColor, glowColor1, intensity)
      : brick.baseColor;

    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, displayColor);
    gradient.addColorStop(1, this.darkenColor(displayColor, 0.15));

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);

    if (intensity > 0 && spreadProgress > 0) {
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      const maxRadius = Math.sqrt(size * size * 2) / 2;
      const glowRadius = maxRadius * spreadProgress;

      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowRadius
      );
      const rgbGlow = this.colorToRgbString(glowColor1);
      glowGradient.addColorStop(0, `rgba(${rgbGlow}, ${0.8 * intensity})`);
      glowGradient.addColorStop(0.5, `rgba(${rgbGlow}, ${0.3 * intensity})`);
      glowGradient.addColorStop(1, `rgba(${rgbGlow}, 0)`);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, size, size);
      ctx.clip();
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - size, y - size, size * 3, size * 3);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = intensity * 0.5;
      ctx.shadowColor = glowColor1;
      ctx.shadowBlur = 20 * intensity;
      ctx.fillStyle = glowColor1;
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      ctx.restore();
    }

    this.drawGlassTexture(x, y, size, intensity);
  }

  private getBandCategoryForColumn(col: number): BandCategory {
    if (col <= 2) return 'low';
    if (col <= 5) return 'mid';
    return 'high';
  }

  private drawGlassTexture(x: number, y: number, size: number, intensity: number): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + intensity * 0.1})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x + 5, y + 2);
    ctx.lineTo(x + 2, y + size - 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size - 5, y + 3);
    ctx.lineTo(x + size - 2, y + size - 8);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + intensity * 0.05})`;
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + 3);
    ctx.lineTo(x + size / 2 - 3, y + size - 3);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + intensity * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(x + size * 0.35, y + size * 0.3, size * 0.15, size * 0.08, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private blendColors(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1);
    const c2 = /^rgb/.test(color2) ? this.parseRgb(color2) : hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private parseRgb(rgb: string): { r: number; g: number; b: number } {
    const match = rgb.match(/\d+/g);
    if (match && match.length >= 3) {
      return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
    }
    return { r: 255, g: 255, b: 255 };
  }

  private darkenColor(color: string, amount: number): string {
    const rgb = /^rgb/.test(color) ? this.parseRgb(color) : hexToRgb(color);
    const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  private colorToRgbString(color: string): string {
    const rgb = /^rgb/.test(color) ? this.parseRgb(color) : hexToRgb(color);
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  }

  reset(): void {
    const now = performance.now();
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        this.bricks[row][col].glowIntensity = 0;
        this.bricks[row][col].glowStartTime = -1;
        this.bricks[row][col].lastBeatTime = now - 1000;
      }
    }
    this.render();
  }
}
